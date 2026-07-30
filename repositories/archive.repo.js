/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `archives`. */
const { query } = require('../db/mysql');

const findAll   = () => query('SELECT * FROM archives ORDER BY archived_at DESC');
const findIds   = () => query('SELECT id FROM archives');

async function findById(id) {
  const rows = await query('SELECT * FROM archives WHERE id = ?', [id]);
  return rows[0] || null;
}

async function insert({ project_id, project_json, items_json, summary_json, archived_at, archived_note }) {
  const r = await query(
    `INSERT INTO archives (project_id, project_json, items_json, summary_json, archived_at, archived_note)
     VALUES (?,?,?,?,?,?)`,
    [project_id, project_json, items_json, summary_json, archived_at, archived_note]
  );
  return r.insertId;
}

module.exports = { findAll, findIds, findById, insert };
