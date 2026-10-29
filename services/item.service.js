/* TẦNG SERVICE — nghiệp vụ hạng mục & tình hình triển khai. */
const itemRepo     = require('../repositories/item.repo');
const projectRepo  = require('../repositories/project.repo');
const tinhHinhRepo = require('../repositories/tinhHinh.repo');
const fileRepo     = require('../repositories/tinhHinhFile.repo');
const fileService  = require('./tinhHinhFile.service');
const audit       = require('./audit.service');
const rules        = require('./status.rules');
const siteService  = require('./site.service');
const { badRequest, notFound } = require('../utils/AppError');

/* Đối chiếu trạng thái đang lưu với trạng thái suy ra từ ngày tháng.
   Chỗ nào lệch thì ghi lại vào DB, rồi trả về danh sách đã cập nhật.
   (Giữ đúng hành vi cũ: hàm này CÓ ghi vào DB, không chỉ tính toán.) */
async function dongBoTrangThai(items) {
  const ketQua = [];
  for (const item of items) {
    const trangThaiMoi = rules.suyRaTrangThai(item);
    if (trangThaiMoi !== item.status) {
      await itemRepo.updateStatus(item.id, trangThaiMoi);
      ketQua.push({ ...item, status: trangThaiMoi });
    } else {
      ketQua.push(item);
    }
  }
  return ketQua;
}

/* Bảng tra id -> tên dự án, để gắn `project_name` vào hạng mục. */
async function bangTenDuAn(site) {
  const projects = await projectRepo.findNames(site);
  return Object.fromEntries(projects.map(p => [p.id, p.name]));
}

/* Chuẩn hóa dữ liệu từ form về đúng kiểu trước khi xuống DB. */
function chuanHoaHangMuc(f) {
  return {
    project_id: parseInt(f.project_id),
    name:       f.name,
    group_name: f.group_name || '',
    contractor: f.contractor || '',
    start_date: f.start_date || null,
    end_date:   f.end_date   || null,
    progress:   parseInt(f.progress) || 0,
    actual_vol: f.actual_vol || '',
    disbursed:  parseFloat(f.disbursed) || 0,
    note:       f.note || '',
  };
}

async function kiemTraDuAnTonTai(projectId, site) {
  if (!(await projectRepo.exists(projectId, site))) {
    throw badRequest('Dự án không tồn tại');
  }
}

/* Chặn thao tác trên hạng mục / tình hình thuộc site khác. */
async function kiemTraHangMucCuaSite(nguoiDung, itemId) {
  siteService.kiemTraThuoc(siteService.siteCua(nguoiDung), await itemRepo.findSite(itemId), 'Không tìm thấy hạng mục');
}

/* ── DANH SÁCH HẠNG MỤC (có lọc) ──────────────────────────── */
async function danhSach(site, { project_id, status, search }) {
  const tenDuAn = await bangTenDuAn(site);

  let items = await dongBoTrangThai(await itemRepo.findAll(site));

  if (project_id) items = items.filter(i => i.project_id === parseInt(project_id));
  if (status)     items = items.filter(i => i.status === status);

  if (search) {
    const tuKhoa = search.toLowerCase();
    items = items.filter(i =>
      i.name.toLowerCase().includes(tuKhoa) ||
      (i.assignee   || '').toLowerCase().includes(tuKhoa) ||
      (i.contractor || '').toLowerCase().includes(tuKhoa)
    );
  }

  return items
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .map(i => ({ ...i, project_name: tenDuAn[i.project_id] || '' }));
}

/* ── TẠO / SỬA / XÓA HẠNG MỤC ─────────────────────────────── */
async function tao(nguoiDung, f) {
  if (!f.name || !f.project_id) throw badRequest('Thiếu thông tin bắt buộc');
  await kiemTraDuAnTonTai(parseInt(f.project_id), siteService.siteCua(nguoiDung));

  /* Người phụ trách hạng mục luôn là người thêm hạng mục. */
  const id = await itemRepo.insert({
    ...chuanHoaHangMuc(f),
    assignee: nguoiDung.name || '',
    status:   f.status   || rules.STATUS.CHUA_BAT_DAU,
    priority: f.priority || 'binh_thuong',
  });

  await audit.ghiNhatKy({
    user: nguoiDung, action: 'create', entity: 'item',
    entity_id: id, entity_name: f.name,
  });
  return id;
}

async function capNhat(nguoiDung, id, f) {
  if (!f.name || !f.project_id) throw badRequest('Thiếu thông tin bắt buộc');
  await kiemTraHangMucCuaSite(nguoiDung, id);
  await kiemTraDuAnTonTai(parseInt(f.project_id), siteService.siteCua(nguoiDung));

  /* Người phụ trách cố định theo người tạo -> sửa không đổi được. */
  const hienTai = await itemRepo.findById(id);
  if (!hienTai) throw notFound('Không tìm thấy hạng mục');

  await itemRepo.update(id, {
    ...chuanHoaHangMuc(f),
    assignee:  hienTai.assignee || '',
    status:    f.status,
    priority:  f.priority,
    done_date: f.done_date || null,
  });

  await audit.ghiNhatKy({
    user: nguoiDung, action: 'update', entity: 'item',
    entity_id: id, entity_name: f.name,
  });
}

async function xoa(nguoiDung, id) {
  await kiemTraHangMucCuaSite(nguoiDung, id);
  const item = await itemRepo.findById(id);
  const files = await fileRepo.findTenLuuByItem(id);
  await itemRepo.remove(id);
  await fileService.xoaTrenDia(files);
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'delete', entity: 'item',
    entity_id: id, entity_name: item?.name || '',
  });
}

/* ── TÌNH HÌNH TRIỂN KHAI ─────────────────────────────────── */
async function danhSachTinhHinh(nguoiDung, itemId) {
  await kiemTraHangMucCuaSite(nguoiDung, itemId);
  return fileService.ganFile(await tinhHinhRepo.findByItem(itemId));
}

async function themTinhHinh(nguoiDung, itemId, noiDung) {
  await kiemTraHangMucCuaSite(nguoiDung, itemId);
  const item = await itemRepo.findById(itemId);
  if (!item) throw notFound('Không tìm thấy hạng mục');

  const id = await tinhHinhRepo.insert(itemId, noiDung || '');
  /* Chạm updated_at để hạng mục nổi lên đầu danh sách "gần đây". */
  await itemRepo.touch(itemId);

  await audit.ghiNhatKy({
    user: nguoiDung, action: 'create', entity: 'tinh_hinh',
    entity_id: id, entity_name: item.name,
  });
  return id;
}

async function xoaTinhHinh(nguoiDung, id) {
  siteService.kiemTraThuoc(siteService.siteCua(nguoiDung), await tinhHinhRepo.findSite(id));
  const log = await tinhHinhRepo.findById(id);
  const files = await fileRepo.findTenLuuByTinhHinh(id);
  await tinhHinhRepo.remove(id);
  await fileService.xoaTrenDia(files);
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'delete', entity: 'tinh_hinh',
    entity_id: id, entity_name: log?.noi_dung?.slice(0, 50) || '',
  });
}

module.exports = {
  dongBoTrangThai, bangTenDuAn,
  danhSach, tao, capNhat, xoa,
  danhSachTinhHinh, themTinhHinh, xoaTinhHinh,
};
