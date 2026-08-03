-- Migration 002: thêm email cho users và người phụ trách cho projects
-- (phục vụ tính năng nhắc nhở định kỳ qua Outlook)
-- Chạy: mysql -u root -p pman < db/migrations/002_add_email_and_manager.sql
--
-- An toàn để chạy lại: mỗi ALTER kiểm tra cột/khoá đã tồn tại chưa trước khi thêm.
-- BẮT BUỘC backup DB trước khi chạy (xem db/DEPLOY_REMOTE_MYSQL.txt hoặc
-- huong-phat-trien/nhac-nho-outlook.md mục backup).

SET @db := DATABASE();

-- users.email
SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='email') = 0,
  'ALTER TABLE users ADD COLUMN email VARCHAR(150) NULL AFTER don_vi',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- projects.manager_user_id
SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='projects' AND column_name='manager_user_id') = 0,
  'ALTER TABLE projects ADD COLUMN manager_user_id INT NULL AFTER budget',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK projects.manager_user_id -> users.id (ON DELETE SET NULL: xoá user không xoá dự án)
SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
     WHERE table_schema=@db AND table_name='projects' AND constraint_name='fk_projects_manager') = 0,
  'ALTER TABLE projects ADD CONSTRAINT fk_projects_manager FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
