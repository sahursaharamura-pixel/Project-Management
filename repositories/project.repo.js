/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `projects`.
   Không có nghiệp vụ, không biết gì về HTTP (req/res). */
const { query } = require('../db/mysql');

const findAll        = ()   => query('SELECT * FROM projects');
const findAllActive  = ()   => query('SELECT * FROM projects WHERE archived = 0');
const findNames      = ()   => query('SELECT id, name FROM projects');

async function findById(id) {
  const rows = await query('SELECT * FROM projects WHERE id = ?', [id]);
  return rows[0] || null;
}

async function exists(id) {
  const rows = await query('SELECT id FROM projects WHERE id = ?', [id]);
  return rows.length > 0;
}

async function insert({ name, code, note, start_date, end_date, budget }) {
  const r = await query(
    'INSERT INTO projects (name, code, note, start_date, end_date, budget) VALUES (?,?,?,?,?,?)',
    [name, code, note, start_date, end_date, budget]
  );
  return r.insertId;
}

function update(id, { name, code, note, start_date, end_date, budget }) {
  return query(
    'UPDATE projects SET name=?, code=?, note=?, start_date=?, end_date=?, budget=? WHERE id=?',
    [name, code, note, start_date, end_date, budget, id]
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
