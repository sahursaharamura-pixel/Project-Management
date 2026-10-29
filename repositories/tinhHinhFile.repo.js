/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `tinh_hinh_files`
   (văn bản PDF/Word đính kèm theo từng cập nhật tình hình triển khai).
   File thật nằm trên đĩa, bảng này chỉ giữ thông tin + tên file đã lưu. */
const { query } = require('../db/mysql');

/* Tạo bảng nếu chưa có — gọi 1 lần lúc khởi động (db/init.js),
   để server cũ không cần chạy migration tay vẫn dùng được tính năng. */
const ensureTable = () => query(`
  CREATE TABLE IF NOT EXISTS tinh_hinh_files (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    tinh_hinh_id  INT NOT NULL,
    ten_goc       VARCHAR(255) NOT NULL,
    ten_luu       VARCHAR(100) NOT NULL,
    mime          VARCHAR(100) NOT NULL,
    kich_thuoc    INT NOT NULL DEFAULT 0,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tinh_hinh_id) REFERENCES tinh_hinh(id) ON DELETE CASCADE,
    INDEX idx_thfile_tinhhinh (tinh_hinh_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

const findByTinhHinhIds = (ids) =>
  ids.length
    ? query('SELECT * FROM tinh_hinh_files WHERE tinh_hinh_id IN (?) ORDER BY id', [ids])
    : Promise.resolve([]);

/* Toàn bộ văn bản (của 1 site) kèm hạng mục/dự án — cho trợ lý AI biết có những file nào. */
const findAllKemHangMuc = (site) =>
  query(
    `SELECT f.id, f.ten_goc, f.created_at, th.item_id, i.project_id
       FROM tinh_hinh_files f
       INNER JOIN tinh_hinh th ON f.tinh_hinh_id = th.id
       INNER JOIN items i      ON th.item_id = i.id
       INNER JOIN projects p   ON p.id = i.project_id
     WHERE p.site = ?
     ORDER BY f.created_at DESC`,
    [site]
  );

/* Site của 1 văn bản — để chặn xem/xóa chéo site. */
async function findSite(id) {
  const rows = await query(
    `SELECT p.site FROM tinh_hinh_files f
       INNER JOIN tinh_hinh th ON f.tinh_hinh_id = th.id
       INNER JOIN items i      ON th.item_id = i.id
       INNER JOIN projects p   ON p.id = i.project_id
     WHERE f.id = ?`,
    [id]
  );
  return rows[0]?.site || null;
}

async function findById(id) {
  const rows = await query('SELECT * FROM tinh_hinh_files WHERE id = ?', [id]);
  return rows[0] || null;
}

/* Tên file đã lưu của mọi văn bản thuộc 1 hạng mục / 1 dự án —
   lấy TRƯỚC khi xóa (bảng tự xóa theo CASCADE) để dọn file trên đĩa. */
const findTenLuuByTinhHinh = (tinhHinhId) =>
  query('SELECT ten_luu FROM tinh_hinh_files WHERE tinh_hinh_id = ?', [tinhHinhId]);

const findTenLuuByItem = (itemId) =>
  query(
    `SELECT f.ten_luu FROM tinh_hinh_files f
       INNER JOIN tinh_hinh th ON f.tinh_hinh_id = th.id
     WHERE th.item_id = ?`,
    [itemId]
  );

const findTenLuuByProject = (projectId) =>
  query(
    `SELECT f.ten_luu FROM tinh_hinh_files f
       INNER JOIN tinh_hinh th ON f.tinh_hinh_id = th.id
       INNER JOIN items i      ON th.item_id = i.id
     WHERE i.project_id = ?`,
    [projectId]
  );

/* Toàn bộ file của 1 site — dùng khi reset dữ liệu của site đó. */
const findTenLuuBySite = (site) =>
  query(
    `SELECT f.ten_luu FROM tinh_hinh_files f
       INNER JOIN tinh_hinh th ON f.tinh_hinh_id = th.id
       INNER JOIN items i      ON th.item_id = i.id
       INNER JOIN projects p   ON p.id = i.project_id
     WHERE p.site = ?`,
    [site]
  );

async function insert({ tinhHinhId, tenGoc, tenLuu, mime, kichThuoc }) {
  const r = await query(
    'INSERT INTO tinh_hinh_files (tinh_hinh_id, ten_goc, ten_luu, mime, kich_thuoc) VALUES (?,?,?,?,?)',
    [tinhHinhId, tenGoc, tenLuu, mime, kichThuoc]
  );
  return r.insertId;
}

const remove = (id) => query('DELETE FROM tinh_hinh_files WHERE id = ?', [id]);

module.exports = {
  ensureTable, findByTinhHinhIds, findAllKemHangMuc, findById, findSite,
  findTenLuuByTinhHinh, findTenLuuByItem, findTenLuuByProject, findTenLuuBySite,
  insert, remove,
};
