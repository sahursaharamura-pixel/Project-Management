-- Schema cho hệ thống quản lý dự án (pman)
-- Chạy: mysql -u root -p pman < db/schema.sql

CREATE TABLE IF NOT EXISTS projects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  code        VARCHAR(50)  NOT NULL DEFAULT '',
  note        TEXT,
  start_date  DATE NULL,
  end_date    DATE NULL,
  budget      DECIMAL(18,2) NOT NULL DEFAULT 0,
  archived    TINYINT(1) NOT NULL DEFAULT 0,
  archived_at DATETIME NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  project_id  INT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  group_name  VARCHAR(255) NOT NULL DEFAULT '',
  contractor  VARCHAR(255) NOT NULL DEFAULT '',
  assignee    VARCHAR(255) NOT NULL DEFAULT '',
  start_date  DATE NULL,
  end_date    DATE NULL,
  progress    INT NOT NULL DEFAULT 0,
  status      VARCHAR(30) NOT NULL DEFAULT 'chua_bat_dau',
  priority    VARCHAR(30) NOT NULL DEFAULT 'binh_thuong',
  actual_vol  VARCHAR(255) NOT NULL DEFAULT '',
  disbursed   DECIMAL(18,2) NOT NULL DEFAULT 0,
  note        TEXT,
  done_date   DATE NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_items_project (project_id),
  INDEX idx_items_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tinh_hinh (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  item_id     INT NOT NULL,
  noi_dung    TEXT,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  INDEX idx_tinhhinh_item (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bản ghi lưu trữ dự án hoàn thành: giữ nguyên snapshot dạng JSON (không cần chuẩn hoá vì chỉ đọc)
CREATE TABLE IF NOT EXISTS archives (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  project_id      INT NOT NULL,
  project_json    JSON NOT NULL,
  items_json      JSON NOT NULL,
  summary_json    JSON NOT NULL,
  archived_at     DATETIME NOT NULL,
  archived_note   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  username              VARCHAR(100) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NULL,
  name                  VARCHAR(150) NOT NULL,
  role                  ENUM('admin','user') NOT NULL DEFAULT 'user',
  disabled              TINYINT(1) NOT NULL DEFAULT 0,
  must_change_password  TINYINT(1) NOT NULL DEFAULT 0,
  auth_source           VARCHAR(20) NOT NULL DEFAULT 'local',
  ma_nhan_vien          VARCHAR(50) NULL,
  chuc_danh             VARCHAR(150) NULL,
  phong_ban             VARCHAR(150) NULL,
  don_vi                VARCHAR(150) NULL,
  email                 VARCHAR(150) NULL,
  created_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY idx_users_ma_nhan_vien (ma_nhan_vien)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- projects.manager_user_id thêm sau vì FK cần bảng users đã tồn tại
ALTER TABLE projects
  ADD COLUMN manager_user_id INT NULL AFTER budget,
  ADD CONSTRAINT fk_projects_manager
    FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS audit_log (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NULL,
  username      VARCHAR(100) NOT NULL DEFAULT 'system',
  name          VARCHAR(150) NOT NULL DEFAULT 'Hệ thống',
  action        VARCHAR(30) NOT NULL,
  entity        VARCHAR(30) NOT NULL,
  entity_id     INT NULL,
  entity_name   VARCHAR(255) NOT NULL DEFAULT '',
  detail        TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
