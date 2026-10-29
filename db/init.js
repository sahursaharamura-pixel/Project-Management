const bcrypt = require('bcryptjs');
const { query } = require('./mysql');

/* ── SEED DỮ LIỆU MẪU (chỉ khi bảng projects rỗng) ── */
async function seedIfEmpty() {
  const [{ c }] = await query('SELECT COUNT(*) c FROM projects');
  if (c > 0) return;

  const projs = [
    { name:'Đường tỉnh 921',        code:'DA001', note:'Nâng cấp mở rộng K0-K18',        start_date:'2026-01-10', end_date:'2026-09-30', budget:45e9 },
    { name:'Kênh thủy lợi Cái Sắn', code:'DA002', note:'Nạo vét gia cố 12km',             start_date:'2026-02-01', end_date:'2026-12-15', budget:28e9 },
    { name:'Trụ sở UBND Phong Điền',code:'DA003', note:'Xây dựng mới trụ sở UBND huyện', start_date:'2026-01-15', end_date:'2026-10-30', budget:18e9 },
    { name:'Cầu Ô Môn – Giai đoạn 2',code:'DA004',note:'Km5+200',                         start_date:'2026-01-10', end_date:'2026-12-31', budget:120e9 },
  ];
  const projIds = [];
  for (const p of projs) {
    const r = await query(
      'INSERT INTO projects (name, code, note, start_date, end_date, budget) VALUES (?,?,?,?,?,?)',
      [p.name, p.code, p.note, p.start_date, p.end_date, p.budget]
    );
    projIds.push(r.insertId);
  }

  const items = [
    [0,'Thi công móng cọc A1',    'Gói 1','Cty XD ABC',      'Nguyễn Văn A','2026-01-15','2026-06-20',100,'hoan_thanh',   'binh_thuong',5e9],
    [0,'Rải đá dăm lớp 1-2',      'Gói 2','Cty XD XYZ',      'Trần Thị B',  '2026-05-01','2026-07-15', 70,'dang_thuc_hien','binh_thuong',5.6e9],
    [0,'Thảm nhựa & sơn kẻ vạch', 'Gói 2','Cty XD XYZ',      'Trần Thị B',  '2026-07-20','2026-08-30',  0,'chua_bat_dau', 'binh_thuong',0],
    [1,'Đặt cống thoát nước K2',   'Gói 1','Cty TL MK',       'Lê Văn C',    '2026-03-01','2026-07-30', 60,'dang_thuc_hien','binh_thuong',3.6e9],
    [1,'Gia cố bờ kênh đoạn 1',   'Gói 1','Cty TL MK',       'Lê Văn C',    '2026-02-15','2026-05-30',100,'hoan_thanh',   'binh_thuong',4e9],
    [2,'Hoàn thiện nội thất T1',   'Gói NT','Cty NT CT',      'Phạm Văn D',  '2026-04-01','2026-07-01', 25,'cham_tien_do','quan_trong',7.5e8],
    [2,'Lắp đặt hệ thống điện',   'Gói M&E','Cty Điện ACB',  'Đỗ Thị F',    '2026-05-01','2026-08-30',  0,'chua_bat_dau','binh_thuong',0],
    [3,'Đóng cọc trụ cầu P3-P5',  'Gói chính','TCty Cầu đường','Hoàng Văn E','2026-02-01','2026-06-15', 10,'qua_han',     'khan_cap',2.5e9],
    [3,'Thi công mố cầu M1-M2',   'Gói chính','TCty Cầu đường','Hoàng Văn E','2026-01-20','2026-04-30',100,'hoan_thanh',  'binh_thuong',15e9],
  ];
  for (const [pidx,name,group_name,contractor,assignee,start_date,end_date,progress,status,priority,disbursed] of items) {
    await query(
      `INSERT INTO items (project_id,name,group_name,contractor,assignee,start_date,end_date,progress,status,priority,disbursed)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [projIds[pidx], name, group_name, contractor, assignee, start_date, end_date, progress, status, priority, disbursed]
    );
  }
  console.log('✅ Dữ liệu demo đã được tạo');
}

/* ── SEED TÀI KHOẢN ADMIN MẶC ĐỊNH ── */
async function seedAdminIfEmpty() {
  const [{ c }] = await query('SELECT COUNT(*) c FROM users');
  if (c > 0) return;
  const hash = bcrypt.hashSync('changeme', 10);
  await query(
    'INSERT INTO users (username, password_hash, name, role, must_change_password) VALUES (?,?,?,?,1)',
    ['admin', hash, 'Quản trị viên', 'admin']
  );
  console.log('✅ Tài khoản admin mặc định: admin / changeme (đổi mật khẩu ngay sau khi đăng nhập)');
}

/* ── TÁCH DỮ LIỆU THEO SITE (đơn vị) ──
   Thêm cột nếu chưa có, để server cũ không cần chạy migration tay
   (db/migrations/004_add_site.sql làm đúng việc này nếu muốn chạy tay).
   Dữ liệu cũ nhận DEFAULT 'khcn' -> vẫn thuộc Ban KHCN&CĐS như trước. */
async function themCotNeuChua(bang, cot, dinhNghia) {
  const [{ c }] = await query(
    `SELECT COUNT(*) c FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [bang, cot]
  );
  if (c === 0) {
    await query(`ALTER TABLE ${bang} ADD COLUMN ${cot} ${dinhNghia}`);
    console.log(`✅ Đã thêm cột ${bang}.${cot}`);
  }
}

async function ensureSiteColumns() {
  await themCotNeuChua('users',    'don_vi_id', 'INT NULL AFTER don_vi');
  await themCotNeuChua('projects', 'site', "VARCHAR(20) NOT NULL DEFAULT 'khcn', ADD INDEX idx_projects_site (site)");
  await themCotNeuChua('archives', 'site', "VARCHAR(20) NOT NULL DEFAULT 'khcn', ADD INDEX idx_archives_site (site)");
}

async function initDB() {
  await require('../repositories/tinhHinhFile.repo').ensureTable();
  await ensureSiteColumns();
  await seedIfEmpty();
  await seedAdminIfEmpty();
}

/* ── AUDIT LOG ──
   user: { id, username, name } (req.session.user) hoặc null (hệ thống)
*/
async function logAudit({ user, action, entity, entity_id, entity_name, detail }) {
  await query(
    `INSERT INTO audit_log (user_id, username, name, action, entity, entity_id, entity_name, detail)
     VALUES (?,?,?,?,?,?,?,?)`,
    [
      user ? user.id : null,
      user ? user.username : 'system',
      user ? user.name : 'Hệ thống',
      action, entity,
      entity_id ?? null,
      entity_name || '',
      detail || '',
    ]
  );
}

module.exports = { initDB, logAudit };
