/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `items`. */
const { query } = require('../db/mysql');

const findAll          = ()   => query('SELECT * FROM items');
const findByProject    = (projectId) => query('SELECT * FROM items WHERE project_id = ?', [projectId]);

async function findById(id) {
  const rows = await query('SELECT * FROM items WHERE id = ?', [id]);
  return rows[0] || null;
}

const COLUMNS = `project_id,name,group_name,contractor,assignee,start_date,end_date,
                 progress,status,priority,actual_vol,disbursed,note`;

async function insert(f) {
  const r = await query(
    `INSERT INTO items (${COLUMNS}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [f.project_id, f.name, f.group_name, f.contractor, f.assignee,
     f.start_date, f.end_date, f.progress, f.status, f.priority,
     f.actual_vol, f.disbursed, f.note]
  );
  return r.insertId;
}

function update(id, f) {
  return query(
    `UPDATE items SET project_id=?, name=?, group_name=?, contractor=?, assignee=?,
       start_date=?, end_date=?, progress=?, status=?, priority=?,
       actual_vol=?, disbursed=?, note=?, done_date=?
     WHERE id = ?`,
    [f.project_id, f.name, f.group_name, f.contractor, f.assignee,
     f.start_date, f.end_date, f.progress, f.status, f.priority,
     f.actual_vol, f.disbursed, f.note, f.done_date, id]
  );
}

const remove = (id) => query('DELETE FROM items WHERE id = ?', [id]);

/* Dùng bởi cơ chế tự động cập nhật trạng thái theo ngày (xem services/status.js) */
const updateStatus = (id, status) =>
  query('UPDATE items SET status = ? WHERE id = ?', [status, id]);

/* Chạm vào updated_at khi có tình hình mới, để hạng mục nổi lên đầu danh sách */
const touch = (id) => query('UPDATE items SET updated_at = NOW() WHERE id = ?', [id]);

module.exports = {
  findAll, findByProject, findById,
  insert, update, remove, updateStatus, touch,
};
