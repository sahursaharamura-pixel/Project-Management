-- Bảng lưu session đăng nhập.
--
-- BÌNH THƯỜNG KHÔNG CẦN CHẠY FILE NÀY: sessionStore.js đặt
-- `createDatabaseTable: true` nên bảng sẽ tự sinh ra ở lần khởi động đầu tiên.
--
-- CHỈ chạy tay khi user MySQL của ứng dụng (pman_app) KHÔNG có quyền CREATE TABLE.
-- Khi đó: nhờ admin DB chạy file này, rồi sửa sessionStore.js thành
-- `createDatabaseTable: false`.

CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
  `expires`    INT(11) UNSIGNED NOT NULL,
  `data`       MEDIUMTEXT COLLATE utf8mb4_bin,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Xem các phiên đang đăng nhập:
--   SELECT session_id, FROM_UNIXTIME(expires) AS het_han FROM sessions;
--
-- Buộc đăng xuất TẤT CẢ người dùng (vd: sau sự cố):
--   TRUNCATE TABLE sessions;
