-- ══════════════════════════════════════════════════════════════
-- CSDL MẪU ĐỂ CHẠY THỬ TRÊN MÁY CÁ NHÂN (localhost)
--
-- Tạo database RIÊNG tên `pman_local` + tài khoản MySQL `pman_local`,
-- KHÔNG đụng tới database `pman` (nếu máy đã có) hay server thật.
-- Chạy lại bao nhiêu lần cũng được: mỗi lần sẽ xoá & tạo lại pman_local.
--
-- CÁCH CHẠY (cần mật khẩu root MySQL trên máy):
--   mysql -u root -p --default-character-set=utf8mb4 < db/local-sample.sql
-- Sau đó: node start-local.js  ->  http://localhost:3000
--
-- Tài khoản đăng nhập mẫu:
--   admin      / changeme   (quản trị — toàn quyền)
--   lanhdao    / 123456     (Phó Trưởng Ban — chỉ xem)
--   chuyenvien / 123456     (chuyên viên — nhập liệu)
-- ══════════════════════════════════════════════════════════════

SET NAMES utf8mb4;

DROP DATABASE IF EXISTS pman_local;
CREATE DATABASE pman_local DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'pman_local'@'localhost' IDENTIFIED BY 'pman_local';
GRANT ALL PRIVILEGES ON pman_local.* TO 'pman_local'@'localhost';
FLUSH PRIVILEGES;

USE pman_local;

-- ── Cấu trúc bảng (khớp schema.sql + migrations 001, 002) ──

CREATE TABLE users (
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

CREATE TABLE projects (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  code            VARCHAR(50)  NOT NULL DEFAULT '',
  note            TEXT,
  start_date      DATE NULL,
  end_date        DATE NULL,
  budget          DECIMAL(18,2) NOT NULL DEFAULT 0,
  manager_user_id INT NULL,
  archived        TINYINT(1) NOT NULL DEFAULT 0,
  archived_at     DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_projects_manager
    FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE items (
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

CREATE TABLE tinh_hinh (
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

CREATE TABLE archives (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  project_id      INT NOT NULL,
  project_json    JSON NOT NULL,
  items_json      JSON NOT NULL,
  summary_json    JSON NOT NULL,
  archived_at     DATETIME NOT NULL,
  archived_note   TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE audit_log (
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

CREATE TABLE sessions (
  session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  expires    INT(11) UNSIGNED NOT NULL,
  data       MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Dữ liệu mẫu ──
-- Email để dạng @example.com để không bao giờ gửi nhầm tới người thật.

INSERT INTO users (id, username, password_hash, name, role, must_change_password, chuc_danh, phong_ban, don_vi, email) VALUES
 (1, 'admin',      '$2b$10$KoXL.G/tkYImUapeuPfGSOqFZWhHPXxlTn9jLElnaqi35GyDOF2V.', 'Quản trị viên',     'admin', 0, NULL,              'Ban KHCN&CĐS', 'Tổng công ty', 'admin@example.com'),
 (2, 'lanhdao',    '$2b$10$JUqTaKHoaIKQsZHQkWdQuOzj5yOcuGSzpyYm1V.kI1SfNjisMan0y', 'Nguyễn Văn Lãnh',   'user',  0, 'Phó Trưởng Ban',  'Ban KHCN&CĐS', 'Tổng công ty', 'lanhdao@example.com'),
 (3, 'chuyenvien', '$2b$10$JUqTaKHoaIKQsZHQkWdQuOzj5yOcuGSzpyYm1V.kI1SfNjisMan0y', 'Trần Thị Chuyên',   'user',  0, 'Chuyên viên',     'Ban KHCN&CĐS', 'Tổng công ty', 'chuyenvien@example.com');

INSERT INTO projects (id, name, code, note, start_date, end_date, budget, manager_user_id) VALUES
 (1, 'Dự án Mạng WAN',                 'WAN',  'Nâng cấp hạ tầng mạng diện rộng toàn Tổng công ty', '2026-01-05', '2026-12-31', 35000000000, 3),
 (2, 'Hệ thống quản lý văn bản số',    'QLVB', 'Triển khai e-Office và chữ ký số',                  '2026-03-01', '2026-11-30', 8500000000,  3),
 (3, 'Trung tâm dữ liệu dự phòng (DR)','DR',   'Xây dựng DR site tại nhà máy',                      '2026-02-15', '2027-03-31', 52000000000, 1),
 (4, 'Ứng dụng AI hỗ trợ vận hành',    'AIVH', 'Thí điểm dự báo sự cố thiết bị',                    '2026-06-01', '2027-01-31', 4200000000,  NULL);

INSERT INTO items (id, project_id, name, group_name, contractor, assignee, start_date, end_date, progress, status, priority, disbursed, done_date) VALUES
 (1,  1, 'Lập đề cương, dự toán',            'Chuẩn bị đầu tư', 'Ban KHCN&CĐS',    'Trần Thị Chuyên', '2026-01-05', '2026-02-28', 100, 'hoan_thanh',     'binh_thuong', 0,          '2026-02-25'),
 (2,  1, 'Đấu thầu thiết bị mạng lõi',        'Lựa chọn nhà thầu','Ban KHCN&CĐS',   'Trần Thị Chuyên', '2026-03-01', '2026-05-31', 100, 'hoan_thanh',     'quan_trong',  0,          '2026-05-28'),
 (3,  1, 'Lắp đặt thiết bị tại 12 nhà máy',   'Thi công',        'Cty Viễn thông A', 'Lê Văn Kỹ',       '2026-06-15', '2026-11-30', 65,  'dang_thuc_hien', 'binh_thuong', 12000000000, NULL),
 (4,  1, 'Nghiệm thu, bàn giao',              'Nghiệm thu',      'Ban KHCN&CĐS',    'Trần Thị Chuyên', '2026-12-01', '2026-12-31', 0,   'chua_bat_dau',   'binh_thuong', 0,          NULL),
 (5,  2, 'Khảo sát quy trình văn bản',        'Chuẩn bị',        'Cty Phần mềm B',  'Phạm Thị Số',     '2026-03-01', '2026-04-15', 100, 'hoan_thanh',     'binh_thuong', 500000000,  '2026-04-10'),
 (6,  2, 'Tích hợp chữ ký số',                'Phát triển',      'Cty Phần mềm B',  'Phạm Thị Số',     '2026-05-01', '2026-08-31', 40,  'cham_tien_do',   'quan_trong',  1200000000, NULL),
 (7,  2, 'Đào tạo người dùng',                'Triển khai',      'Cty Phần mềm B',  'Phạm Thị Số',     '2026-09-01', '2026-10-15', 10,  'qua_han',        'khan_cap',    0,          NULL),
 (8,  3, 'Thiết kế kỹ thuật DR site',         'Thiết kế',        'Cty Tư vấn C',    'Hoàng Văn Dự',    '2026-02-15', '2026-05-30', 100, 'hoan_thanh',     'binh_thuong', 2000000000, '2026-05-20'),
 (9,  3, 'Xây dựng phòng máy',                'Thi công',        'Cty Xây lắp D',   'Hoàng Văn Dự',    '2026-06-01', '2026-12-31', 55,  'dang_thuc_hien', 'binh_thuong', 9000000000, NULL),
 (10, 3, 'Cài đặt máy chủ & lưu trữ',         'Thi công',        'Cty Tích hợp E',  'Hoàng Văn Dự',    '2027-01-01', '2027-03-31', 0,   'chua_bat_dau',   'binh_thuong', 0,          NULL),
 (11, 4, 'Thu thập dữ liệu vận hành',         'Dữ liệu',         'Ban KHCN&CĐS',    'Trần Thị Chuyên', '2026-06-01', '2026-09-30', 80,  'dang_thuc_hien', 'binh_thuong', 300000000,  NULL),
 (12, 4, 'Huấn luyện mô hình dự báo',         'Phát triển',      'Viện nghiên cứu F','Đỗ Minh AI',     '2026-10-01', '2026-12-31', 15,  'dang_thuc_hien', 'quan_trong',  0,          NULL);

INSERT INTO tinh_hinh (item_id, noi_dung, created_at) VALUES
 (3,  'Đã lắp xong 8/12 nhà máy, còn 4 nhà máy dự kiến xong trong tháng 11.', '2026-10-20 09:00:00'),
 (3,  'Nhà thầu đề nghị điều chỉnh lịch lắp đặt tại NM Ô Môn do trùng đợt bảo dưỡng.', '2026-10-05 14:30:00'),
 (6,  'Chậm do chờ nhà cung cấp chữ ký số cấp chứng thư cho thiết bị HSM.', '2026-10-15 10:00:00'),
 (7,  'Chưa tổ chức được lớp đào tạo vì phần mềm chưa hoàn thiện chữ ký số.', '2026-10-22 08:15:00'),
 (9,  'Hoàn thành phần thô, đang thi công hệ thống điều hoà chính xác.', '2026-10-18 16:00:00'),
 (11, 'Đã thu thập dữ liệu SCADA 3 năm của 2 nhà máy thí điểm.', '2026-10-10 11:00:00');

INSERT INTO audit_log (user_id, username, name, action, entity, entity_id, entity_name, detail) VALUES
 (NULL, 'system', 'Hệ thống', 'create', 'project', 1, 'Dự án Mạng WAN', 'Tạo từ file dữ liệu mẫu local-sample.sql');
