/* TẦNG SERVICE — nghiệp vụ dự án: CRUD, xem chi tiết, lưu trữ/khôi phục. */
const projectRepo  = require('../repositories/project.repo');
const itemRepo     = require('../repositories/item.repo');
const tinhHinhRepo = require('../repositories/tinhHinh.repo');
const archiveRepo  = require('../repositories/archive.repo');
const fileRepo     = require('../repositories/tinhHinhFile.repo');
const fileService  = require('./tinhHinhFile.service');
const itemService  = require('./item.service');
const audit        = require('./audit.service');
const rules        = require('./status.rules');
const siteService  = require('./site.service');
const { badRequest } = require('../utils/AppError');

const SO_TINH_HINH_GAN_DAY = 20;

/* Lấy dự án, đồng thời chặn nếu dự án thuộc site khác site người dùng đang làm việc. */
async function layDuAnCuaSite(nguoiDung, id) {
  const project = await projectRepo.findById(id);
  siteService.kiemTraThuoc(siteService.siteCua(nguoiDung), project?.site, 'Không tìm thấy dự án');
  return project;
}

/* Chuẩn hóa dữ liệu form dự án về đúng kiểu trước khi xuống DB.
   `managerUserId` là giá trị mặc định cho manager_user_id nếu form không
   truyền field này (vd. lúc tạo mới: mặc định là người đang tạo). */
function chuanHoaDuAn(f, managerUserId) {
  return {
    name:            f.name,
    code:            f.code || '',
    note:            f.note || '',
    start_date:      f.start_date || null,
    end_date:        f.end_date   || null,
    budget:          parseFloat(f.budget) || 0,
    manager_user_id: f.manager_user_id !== undefined ? (f.manager_user_id || null) : managerUserId,
  };
}

/* ── DANH SÁCH DỰ ÁN (kèm tiến độ) ────────────────────────── */
async function danhSach(nguoiDung) {
  const site = siteService.siteCua(nguoiDung);
  const [items, projects] = await Promise.all([
    itemRepo.findAll(site),
    projectRepo.findAllActive(site),
  ]);

  return projects.map(p => {
    const hangMuc = items.filter(i => i.project_id === p.id);
    return {
      ...p,
      total:    hangMuc.length,
      done:     rules.demHoanThanh(hangMuc),
      progress: rules.tinhTienDoDuAn(hangMuc),
    };
  });
}

/* ── TẠO / SỬA / XÓA ──────────────────────────────────────── */
async function tao(nguoiDung, f) {
  if (!f.name) throw badRequest('Tên dự án không được trống');

  /* Người phụ trách mặc định là người tạo dự án, trừ khi form chỉ định người khác. */
  const id = await projectRepo.insert({
    ...chuanHoaDuAn(f, nguoiDung.id),
    site: siteService.siteCua(nguoiDung),
  });
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'create', entity: 'project',
    entity_id: id, entity_name: f.name,
  });
  return id;
}

async function capNhat(nguoiDung, id, f) {
  if (!f.name) throw badRequest('Tên dự án không được trống');

  /* Form sửa không gửi manager_user_id -> giữ nguyên người phụ trách cũ. */
  const hienTai = await layDuAnCuaSite(nguoiDung, id);
  await projectRepo.update(id, chuanHoaDuAn(f, hienTai.manager_user_id ?? null));
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'update', entity: 'project',
    entity_id: id, entity_name: f.name,
  });
}

async function xoa(nguoiDung, id) {
  const project = await layDuAnCuaSite(nguoiDung, id);
  /* Hạng mục, tình hình và văn bản đính kèm tự xóa theo (ON DELETE CASCADE
     trong schema); file trên đĩa thì phải lấy danh sách trước rồi dọn tay. */
  const files = await fileRepo.findTenLuuByProject(id);
  await projectRepo.remove(id);
  await fileService.xoaTrenDia(files);
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'delete', entity: 'project',
    entity_id: id, entity_name: project?.name || '',
  });
}

/* ── CHI TIẾT 1 DỰ ÁN ─────────────────────────────────────── */
async function chiTiet(nguoiDung, id) {
  const project = await layDuAnCuaSite(nguoiDung, id);

  let items = await itemService.dongBoTrangThai(await itemRepo.findByProject(id));
  items = items.sort((a, b) => new Date(a.start_date || 0) - new Date(b.start_date || 0));

  const tinhHinhAll = await fileService.ganFile(
    await tinhHinhRepo.findByItemIds(items.map(i => i.id))
  );

  const itemsWithTH = items.map(i => ({
    ...i,
    tinh_hinh: tinhHinhAll.filter(l => l.item_id === i.id),
  }));

  const tenHangMuc = Object.fromEntries(items.map(i => [i.id, i.name]));
  const recentTH = [...tinhHinhAll]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, SO_TINH_HINH_GAN_DAY)
    .map(l => ({ ...l, item_name: tenHangMuc[l.item_id] || '' }));

  const summary = {
    total:    items.length,
    done:     rules.demHoanThanh(items),
    inprog:   rules.demDangLam(items),
    overdue:  rules.demQuaHan(items),
    slow:     rules.demChamTienDo(items),
    progress: rules.tinhTienDoDuAn(items),
  };

  return { project, items: itemsWithTH, recentTH, summary };
}

/* ── LƯU TRỮ (ARCHIVE) ────────────────────────────────────────
   Chụp lại toàn bộ dự án + hạng mục + tình hình thành snapshot JSON,
   rồi đánh dấu dự án là đã lưu trữ. Snapshot chỉ để đọc, không chuẩn hóa. */
async function luuTru(nguoiDung, id, ghiChu) {
  const project = await layDuAnCuaSite(nguoiDung, id);

  const now  = rules.nowForMySQL();
  const note = ghiChu || '';

  const [items, tinhHinhAll] = await Promise.all([
    itemRepo.findByProject(id),
    tinhHinhRepo.findByProject(id),
  ]);

  const itemsWithTH = items.map(i => ({
    ...i,
    tinh_hinh: tinhHinhAll
      .filter(t => t.item_id === i.id)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  }));

  const summary = {
    total_items:     items.length,
    done_items:      rules.demHoanThanh(items),
    total_disbursed: rules.tongGiaiNgan(items),
    archived_at:     now,
  };

  const archiveId = await archiveRepo.insert({
    project_id:    id,
    site:          project.site,
    project_json:  JSON.stringify({ ...project, archived_at: now, archived_note: note }),
    items_json:    JSON.stringify(itemsWithTH),
    summary_json:  JSON.stringify(summary),
    archived_at:   now,
    archived_note: note,
  });

  await projectRepo.markArchived(id, now);
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'archive', entity: 'project',
    entity_id: id, entity_name: project.name,
  });

  return archiveId;
}

async function khoiPhuc(nguoiDung, id) {
  const project = await layDuAnCuaSite(nguoiDung, id);
  await projectRepo.markUnarchived(id);
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'unarchive', entity: 'project',
    entity_id: id, entity_name: project?.name || '',
  });
}

module.exports = {
  danhSach, tao, capNhat, xoa, chiTiet, luuTru, khoiPhuc,
};
