-- Migration 005: hạng mục con — items.parent_id trỏ về hạng mục cha (chỉ 1 cấp)
-- Chạy: mysql -u root -p pman < db/migrations/005_add_item_parent.sql
--
-- KHÔNG bắt buộc: server tự thêm cột này lúc khởi động (db/init.js -> ensureItemParentColumn).
-- An toàn để chạy lại: kiểm tra cột đã tồn tại chưa trước khi thêm.
-- Hạng mục cũ nhận NULL -> đều là hạng mục lớn như trước.
-- Xóa hạng mục cha thì hạng mục con tự xóa theo (ON DELETE CASCADE).

SET @db := DATABASE();

SET @sql := (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@db AND table_name='items' AND column_name='parent_id') = 0,
  'ALTER TABLE items ADD COLUMN parent_id INT NULL AFTER project_id, ADD INDEX idx_items_parent (parent_id), ADD CONSTRAINT fk_items_parent FOREIGN KEY (parent_id) REFERENCES items(id) ON DELETE CASCADE',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
