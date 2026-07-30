/* TẦNG SERVICE — thao tác quản trị nguy hiểm. */
const { query } = require('../db/mysql');
const audit     = require('./audit.service');

/* XÓA SẠCH dữ liệu nghiệp vụ và đưa AUTO_INCREMENT về 1.
   KHÔNG đụng tới bảng `users` và `audit_log` (giữ đúng hành vi cũ)
   -> tài khoản đăng nhập và lịch sử thao tác vẫn còn nguyên.

   Thứ tự xóa phải theo chiều phụ thuộc khóa ngoại:
   tinh_hinh -> items -> archives -> projects */
async function resetToanBoDuLieu(nguoiDung) {
  await query('DELETE FROM tinh_hinh');
  await query('DELETE FROM items');
  await query('DELETE FROM archives');
  await query('DELETE FROM projects');

  await query('ALTER TABLE projects  AUTO_INCREMENT = 1');
  await query('ALTER TABLE items     AUTO_INCREMENT = 1');
  await query('ALTER TABLE tinh_hinh AUTO_INCREMENT = 1');
  await query('ALTER TABLE archives  AUTO_INCREMENT = 1');

  await audit.ghiNhatKy({
    user: nguoiDung, action: 'delete', entity: 'project',
    entity_name: 'TOÀN BỘ DỮ LIỆU', detail: 'Reset hệ thống',
  });
}

module.exports = { resetToanBoDuLieu };
