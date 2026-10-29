/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `projects`.
   Không có nghiệp vụ, không biết gì về HTTP (req/res).
   Hàm đọc danh sách luôn nhận `site` -> mỗi đơn vị chỉ thấy dự án của mình. */
const { query } = require('../db/mysql');

const findAll        = (site) => query('SELECT * FROM projects WHERE site = ?', [site]);
/* Kèm tên người phụ trách (manager_name) để giao diện hiển thị. */
const findAllActive  = (site) => query(
  `SELECT p.*, u.name AS manager_name FROM projects p
   LEFT JOIN users u ON u.id = p.manager_user_id
   WHERE p.archived = 0 AND p.site = ?`,
  [site]
);
const findNames      = (site) => query('SELECT id, name FROM projects WHERE site = ?', [site]);

async function findById(id) {
  const rows = await query('SELECT * FROM projects WHERE id = ?', [id]);
  return rows[0] || null;
}

async function exists(id, site) {
  const rows = await query('SELECT id FROM projects WHERE id = ? AND site = ?', [id, site]);
  return rows.length > 0;
}

async function insert({ name, code, note, start_date, end_date, budget, manager_user_id, site }) {
  const r = await query(
    'INSERT INTO projects (name, code, note, start_date, end_date, budget, manager_user_id, site) VALUES (?,?,?,?,?,?,?,?)',
    [name, code, note, start_date, end_date, budget, manager_user_id, site]
  );
  return r.insertId;
}

function update(id, { name, code, note, start_date, end_date, budget, manager_user_id }) {
  return query(
    'UPDATE projects SET name=?, code=?, note=?, start_date=?, end_date=?, budget=?, manager_user_id=? WHERE id=?',
    [name, code, note, start_date, end_date, budget, manager_user_id, id]
  );
}

/* items và tinh_hinh tự xóa theo (ON DELETE CASCADE) */
const remove = (id) => query('DELETE FROM projects WHERE id = ?', [id]);

const markArchived = (id, archivedAt) =>
  query('UPDATE projects SET archived = 1, archived_at = ? WHERE id = ?', [archivedAt, id]);

const markUnarchived = (id) =>
  query('UPDATE projects SET archived = 0, archived_at = NULL WHERE id = ?', [id]);

module.exports = {
  findAll, findAllActive, findNames, findById, exists,
  insert, update, remove, markArchived, markUnarchived,
};
