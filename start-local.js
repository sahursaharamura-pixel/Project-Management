/* ══════════════════════════════════════════════════════════════
   CHẠY APP TRÊN MÁY CÁ NHÂN — dùng CSDL mẫu `pman_local` trên localhost.

   Giống hệt server.js (đăng nhập, Dashboard, Dự án... chạy thật), chỉ
   ghi đè vài cấu hình TRƯỚC khi nạp server.js:
     - DB trỏ về MySQL localhost (database/tài khoản pman_local,
       tạo bằng db/local-sample.sql) thay vì server 10.147.0.36
     - Tắt đăng nhập SmartEVN (chỉ dùng tài khoản local trong DB mẫu)
     - Tắt lịch gửi mail nhắc nhở, để không gửi mail thật khi test

   CÁCH DÙNG:
     1. mysql -u root -p --default-character-set=utf8mb4 < db/local-sample.sql
     2. node start-local.js
     3. Mở http://localhost:3000 — đăng nhập admin / changeme

   ⚠️ KHÔNG dùng file này trên server thật — server vẫn chạy server.js. */

const config = require('./config');

Object.assign(config, {
  DB_HOST:     'localhost',
  DB_PORT:     3306,
  DB_USER:     'pman_local',
  DB_PASSWORD: 'pman_local',
  DB_NAME:     'pman_local',
  EVN_AUTH_ENABLED: false,
  PMAN_BASE_URL: 'http://localhost:' + (process.env.PORT || 3000),
  MAIL_CC_LUON_LUON: [],
});

require('./jobs/reminderJob').batDauLich = () =>
  console.log('🕐 (local) Đã TẮT lịch gửi mail nhắc nhở');

require('./server');
