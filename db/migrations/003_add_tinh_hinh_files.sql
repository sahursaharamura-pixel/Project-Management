-- Migration 003: bảng văn bản đính kèm (PDF, Word) cho tình hình triển khai
-- Chạy: mysql -u root -p pman < db/migrations/003_add_tinh_hinh_files.sql
--
-- Không bắt buộc: server tự tạo bảng này lúc khởi động (db/init.js) nếu tài khoản
-- DB có quyền CREATE. Chỉ cần chạy tay khi tài khoản DB của app không có quyền đó.
-- An toàn để chạy lại (CREATE TABLE IF NOT EXISTS).

-- Văn bản (PDF, Word) đính kèm theo từng cập nhật tình hình; file thật nằm ở uploads/tinh-hinh/
CREATE TABLE IF NOT EXISTS tinh_hinh_files (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tinh_hinh_id  INT NOT NULL,
  ten_goc       VARCHAR(255) NOT NULL,
  ten_luu       VARCHAR(100) NOT NULL,
  mime          VARCHAR(100) NOT NULL,
  kich_thuoc    INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tinh_hinh_id) REFERENCES tinh_hinh(id) ON DELETE CASCADE,
  INDEX idx_thfile_tinhhinh (tinh_hinh_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
