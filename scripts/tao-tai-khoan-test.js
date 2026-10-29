/* ══════════════════════════════════════════════════════════════
   TẠO TÀI KHOẢN TEST CHO 1 ĐƠN VỊ (mặc định: Thác Mơ, don_vi_id = 30)

   Tạo tài khoản NỘI BỘ (không qua SmartEVN) gắn don_vi_id, để đăng nhập
   thử site của đơn vị đó. Mật khẩu sinh ngẫu nhiên, chỉ in ra màn hình.
   Chạy lại -> không tạo trùng, chỉ đặt lại mật khẩu + don_vi_id.

   CÁCH DÙNG (trên server, trong thư mục app, SAU KHI đã deploy code mới):
     node scripts/tao-tai-khoan-test.js
     node scripts/tao-tai-khoan-test.js test_vinhson 41     (đơn vị khác)

   XÓA khi test xong:
     node scripts/tao-tai-khoan-test.js --xoa
     node scripts/tao-tai-khoan-test.js --xoa test_vinhson
   ══════════════════════════════════════════════════════════════ */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { initDB } = require('../db/init');
const { query, getPool } = require('../db/mysql');
const siteService = require('../services/site.service');

async function tao(username, donViId) {
  await initDB();   // đảm bảo đã có cột users.don_vi_id (tự thêm nếu thiếu)

  const matKhau = crypto.randomBytes(6).toString('base64url');
  const hash    = bcrypt.hashSync(matKhau, 10);
  const ten     = `Tài khoản test ${siteService.thongTin(siteService.siteTheoDonVi(donViId)).ten}`;

  const [cu] = await query('SELECT id FROM users WHERE username = ?', [username]);
  if (cu) {
    await query(
      `UPDATE users SET password_hash = ?, don_vi_id = ?, disabled = 0, must_change_password = 0,
         auth_source = 'local' WHERE id = ?`,
      [hash, donViId, cu.id]
    );
  } else {
    await query(
      `INSERT INTO users (username, password_hash, name, role, auth_source, chuc_danh, don_vi_id, must_change_password)
       VALUES (?, ?, ?, 'user', 'local', 'Chuyên viên', ?, 0)`,
      [username, hash, ten, donViId]
    );
  }

  const site = siteService.siteTheoDonVi(donViId);
  console.log(`\n✅ ${cu ? 'Đã đặt lại' : 'Đã tạo'} tài khoản test`);
  console.log(`   Tên đăng nhập : ${username}`);
  console.log(`   Mật khẩu      : ${matKhau}`);
  console.log(`   don_vi_id     : ${donViId}  ->  site "${siteService.thongTin(site).ten}"`);
  if (site === siteService.SITE_MAC_DINH && donViId !== null) {
    console.log(`   ⚠️  Mã đơn vị ${donViId} chưa khai báo trong services/site.service.js -> vào site mặc định`);
  }
  console.log('   Quyền         : chuyên viên (nhập liệu)\n');
}

async function xoa(username) {
  const r = await query("DELETE FROM users WHERE username = ? AND auth_source = 'local'", [username]);
  console.log(r.affectedRows ? `\n🗑  Đã xóa tài khoản ${username}\n` : `\nKhông có tài khoản nội bộ ${username}\n`);
}

const args = process.argv.slice(2);
const chay = args[0] === '--xoa'
  ? xoa(args[1] || 'test_thacmo')
  : tao(args[0] || 'test_thacmo', parseInt(args[1] || '30', 10));

chay
  .catch(e => { console.error('❌', e.message); process.exitCode = 1; })
  .finally(() => getPool().end());
