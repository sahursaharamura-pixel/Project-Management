/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `archives`. */
const { query } = require('../db/mysql');

const findAll   = (site) => query('SELECT * FROM archives WHERE site = ? ORDER BY archived_at DESC', [site]);
const findIds   = (site) => query('SELECT id FROM archives WHERE site = ?', [site]);

async function findById(id) {
  const rows = await query('SELECT * FROM archives WHERE id = ?', [id]);
  return rows[0] || null;
}

async function insert({ project_id, site, project_json, items_json, summary_json, archived_at, archived_note }) {
  const r = await query(
    `INSERT INTO archives (project_id, site, project_json, items_json, summary_json, archived_at, archived_note)
     VALUES (?,?,?,?,?,?,?)`,
    [project_id, site, project_json, items_json, summary_json, archived_at, archived_note]
  );
  return r.insertId;
}

module.exports = { findAll, findIds, findById, insert };
