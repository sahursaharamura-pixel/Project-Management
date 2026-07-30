-- Migration 001: bổ sung cột đăng nhập SmartEVN vào bảng `users`
-- Áp dụng cho các CSDL đã được tạo từ schema.sql cũ (thiếu các cột này).
-- Chạy: mysql -u root -p pman < db/migrations/001_add_evn_sso_columns.sql
--
-- An toàn để chạy lại: mỗi ALTER kiểm tra cột đã tồn tại chưa trước khi thêm.

SET @db := DATABASE();

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='auth_source') = 0,
  'ALTER TABLE users ADD COLUMN auth_source VARCHAR(20) NOT NULL DEFAULT ''local'' AFTER must_change_password',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='ma_nhan_vien') = 0,
  'ALTER TABLE users ADD COLUMN ma_nhan_vien VARCHAR(50) NULL AFTER auth_source',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='chuc_danh') = 0,
  'ALTER TABLE users ADD COLUMN chuc_danh VARCHAR(150) NULL AFTER ma_nhan_vien',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='phong_ban') = 0,
  'ALTER TABLE users ADD COLUMN phong_ban VARCHAR(150) NULL AFTER chuc_danh',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='don_vi') = 0,
  'ALTER TABLE users ADD COLUMN don_vi VARCHAR(150) NULL AFTER phong_ban',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- password_hash phải NULL được vì tài khoản đăng nhập qua SmartEVN không có mật khẩu local
SET @sql := (SELECT IF(
  (SELECT IS_NULLABLE FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='password_hash') = 'NO',
  'ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Unique index cho ma_nhan_vien (tra cứu đăng nhập SmartEVN) — MySQL cho phép nhiều NULL trong unique key
SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=@db AND table_name='users' AND index_name='idx_users_ma_nhan_vien') = 0,
  'ALTER TABLE users ADD UNIQUE KEY idx_users_ma_nhan_vien (ma_nhan_vien)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
