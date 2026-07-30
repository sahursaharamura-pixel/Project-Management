/* TẦNG SERVICE — đọc & xuất các bản lưu trữ (snapshot dự án). */
const archiveRepo = require('../repositories/archive.repo');
const { notFound } = require('../utils/AppError');

/* Cột JSON của MySQL có thể trả về chuỗi hoặc object tùy phiên bản driver
   -> chuẩn hóa về object trong mọi trường hợp. */
const parseJSON = (v) => (typeof v === 'string' ? JSON.parse(v) : v);

const doiDangBanLuuTru = (a) => ({
  id:      a.id,
  project: parseJSON(a.project_json),
  items:   parseJSON(a.items_json),
  summary: parseJSON(a.summary_json),
});

async function danhSach() {
  const rows = await archiveRepo.findAll();
  return rows.map(doiDangBanLuuTru);
}

/* Tên file tải về, vd: du-an-DA001-2026-07-14.json */
function tenFileXuat(project) {
  const ma    = (project.code || project.name).replace(/[^a-zA-Z0-9]/g, '-');
  const ngay  = (project.archived_at || '').split('T')[0] || 'archive';
  return `du-an-${ma}-${ngay}.json`;
}

async function xuatFile(id) {
  const row = await archiveRepo.findById(id);
  if (!row) throw notFound('Không tìm thấy');

  const banLuuTru = doiDangBanLuuTru(row);
  return { banLuuTru, tenFile: tenFileXuat(banLuuTru.project) };
}

module.exports = { danhSach, xuatFile };
