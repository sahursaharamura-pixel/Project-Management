/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `tinh_hinh`. */
const { query } = require('../db/mysql');

/* Tình hình của mọi hạng mục thuộc 1 site. */
const findAll = (site) => query(
  `SELECT th.* FROM tinh_hinh th
     INNER JOIN items i    ON th.item_id = i.id
     INNER JOIN projects p ON p.id = i.project_id
   WHERE p.site = ?`,
  [site]
);

const findByItem = (itemId) =>
  query('SELECT * FROM tinh_hinh WHERE item_id = ? ORDER BY created_at DESC', [itemId]);

/* Lấy tình hình của NHIỀU hạng mục trong 1 lần gọi (tránh N+1 query).
   Dùng pool.query() nên MySQL tự mở rộng mảng cho IN (?). */
const findByItemIds = (itemIds) =>
  itemIds.length
    ? query('SELECT * FROM tinh_hinh WHERE item_id IN (?) ORDER BY created_at DESC', [itemIds])
    : Promise.resolve([]);

/* Tình hình của toàn bộ hạng mục thuộc một dự án */
const findByProject = (projectId) =>
  query(
    `SELECT th.* FROM tinh_hinh th
       INNER JOIN items i ON th.item_id = i.id
     WHERE i.project_id = ?`,
    [projectId]
  );

async function findById(id) {
  const rows = await query('SELECT * FROM tinh_hinh WHERE id = ?', [id]);
  return rows[0] || null;
}

/* Site của 1 bản ghi tình hình — để chặn thao tác chéo site. */
async function findSite(id) {
  const rows = await query(
    `SELECT p.site FROM tinh_hinh th
       INNER JOIN items i    ON th.item_id = i.id
       INNER JOIN projects p ON p.id = i.project_id
     WHERE th.id = ?`,
    [id]
  );
  return rows[0]?.site || null;
}

async function insert(itemId, noiDung) {
  const r = await query('INSERT INTO tinh_hinh (item_id, noi_dung) VALUES (?,?)', [itemId, noiDung]);
  return r.insertId;
}

const remove = (id) => query('DELETE FROM tinh_hinh WHERE id = ?', [id]);

module.exports = { findAll, findByItem, findByItemIds, findByProject, findById, findSite, insert, remove };
