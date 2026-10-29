/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `users`. */
const { query } = require('../db/mysql');

/* Danh sách hiển thị cho admin: KHÔNG lấy password_hash ra ngoài. */
const findAllSafe = () =>
  query('SELECT id, username, name, role, chuc_danh, disabled, created_at, email, don_vi, don_vi_id FROM users ORDER BY id');

async function findByUsername(username) {
  const rows = await query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0] || null;
}

async function findById(id) {
  const rows = await query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function existsByUsername(username) {
  const rows = await query('SELECT id FROM users WHERE username = ?', [username]);
  return rows.length > 0;
}

async function insert({ username, password_hash, name, role }) {
  const r = await query(
    'INSERT INTO users (username, password_hash, name, role, must_change_password) VALUES (?,?,?,?,1)',
    [username, password_hash, name, role]
  );
  return r.insertId;
}

/* Cập nhật động: chỉ đụng tới cột nào thực sự được truyền vào.
   `fields` là mảng chuỗi SQL, `params` là mảng giá trị tương ứng. */
function updateFields(id, fields, params) {
  if (!fields.length) return Promise.resolve();
  return query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
}

const updatePassword = (id, passwordHash) =>
  query('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [passwordHash, id]);

const remove = (id) => query('DELETE FROM users WHERE id = ?', [id]);

const count = async () => {
  const [{ c }] = await query('SELECT COUNT(*) c FROM users');
  return c;
};

/* ── Dành cho đăng nhập SmartEVN ── */

/* Đối chiếu theo mã nhân viên EVNID (định danh ổn định). */
async function findByMaNhanVien(ma) {
  const rows = await query('SELECT * FROM users WHERE ma_nhan_vien = ?', [ma]);
  return rows[0] || null;
}

/* Tạo mới tài khoản nguồn EVN (không có mật khẩu local). */
async function insertEvn({ username, name, role, ma_nhan_vien, chuc_danh, phong_ban, don_vi, don_vi_id, email }) {
  const r = await query(
    `INSERT INTO users (username, password_hash, name, role, auth_source, ma_nhan_vien, chuc_danh, phong_ban, don_vi, don_vi_id, email, must_change_password)
     VALUES (?, NULL, ?, ?, 'evn', ?, ?, ?, ?, ?, ?, 0)`,
    [username, name, role, ma_nhan_vien, chuc_danh, phong_ban, don_vi, don_vi_id, email]
  );
  return r.insertId;
}

/* Đồng bộ thông tin hiển thị mỗi lần đăng nhập (tên/chức danh/phòng ban/email có thể đổi).
   KHÔNG đụng role và disabled -> tôn trọng chỉnh sửa của admin. */
const syncEvnInfo = (id, { username, name, chuc_danh, phong_ban, don_vi, don_vi_id, email }) =>
  query(
    `UPDATE users SET username = ?, name = ?, chuc_danh = ?, phong_ban = ?, don_vi = ?, don_vi_id = ?, email = ?, auth_source = 'evn'
     WHERE id = ?`,
    [username, name, chuc_danh, phong_ban, don_vi, don_vi_id, email, id]
  );

module.exports = {
  findAllSafe, findByUsername, findById, existsByUsername,
  insert, updateFields, updatePassword, remove, count,
  findByMaNhanVien, insertEvn, syncEvnInfo,
};
