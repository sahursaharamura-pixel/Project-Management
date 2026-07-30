/* TẦNG REPOSITORY — chỉ chứa SQL thao tác bảng `audit_log`. */
const { query } = require('../db/mysql');

/* Hằng số nội bộ, không nhận từ người dùng -> nội suy thẳng vào SQL an toàn.
   (Đặt placeholder `?` trong mệnh đề LIMIT dễ gây lỗi tuỳ driver.) */
const RECENT_LIMIT = 500;

const findRecent = () =>
  query(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ${RECENT_LIMIT}`);

function insert({ user_id, username, name, action, entity, entity_id, entity_name, detail }) {
  return query(
    `INSERT INTO audit_log (user_id, username, name, action, entity, entity_id, entity_name, detail)
     VALUES (?,?,?,?,?,?,?,?)`,
    [user_id, username, name, action, entity, entity_id, entity_name, detail]
  );
}

module.exports = { findRecent, insert };
