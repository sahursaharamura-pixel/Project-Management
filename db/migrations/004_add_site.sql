-- Migration 004: tách dữ liệu theo site (đơn vị) — Ban KHCN&CĐS / Thác Mơ
-- Chạy: mysql -u root -p pman < db/migrations/004_add_site.sql
--
-- KHÔNG bắt buộc: server tự thêm các cột này lúc khởi động (db/init.js -> ensureSiteColumns).
-- An toàn để chạy lại: mỗi ALTER kiểm tra cột đã tồn tại chưa trước khi thêm.
-- Dữ liệu cũ nhận DEFAULT 'khcn' -> vẫn thuộc Ban KHCN&CĐS như trước.

SET @db := DATABASE();

-- users.don_vi_id: mã đơn vị SmartEVN trả về (donVi.id), dùng để chọn site lúc đăng nhập
SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='users' AND column_name='don_vi_id') = 0,
  'ALTER TABLE users ADD COLUMN don_vi_id INT NULL AFTER don_vi',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- projects.site
SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='projects' AND column_name='site') = 0,
  'ALTER TABLE projects ADD COLUMN site VARCHAR(20) NOT NULL DEFAULT ''khcn'', ADD INDEX idx_projects_site (site)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- archives.site
SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='archives' AND column_name='site') = 0,
  'ALTER TABLE archives ADD COLUMN site VARCHAR(20) NOT NULL DEFAULT ''khcn'', ADD INDEX idx_archives_site (site)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
