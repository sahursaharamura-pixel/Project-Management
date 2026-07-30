const session      = require('express-session');
const MySQLStore   = require('express-mysql-session')(session);
const config       = require('../config');

/*
  Lưu session vào MySQL thay vì RAM.

  LÝ DO: express-session mặc định dùng MemoryStore (lưu trong RAM của
  tiến trình). Trên IIS, iisnode chạy NHIỀU tiến trình node.exe song song
  -> mỗi tiến trình giữ một bộ session riêng -> request rơi vào tiến trình
  khác thì không thấy session -> người dùng bị đăng xuất ngẫu nhiên.

  Lưu vào MySQL thì mọi tiến trình dùng chung một nguồn -> hết lỗi.
  Đồng thời session còn sống sót qua lần restart / recycle App Pool.
*/

function createSessionStore() {
  const store = new MySQLStore({
    host:     config.DB_HOST,
    port:     config.DB_PORT,
    user:     config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,

    // Tự tạo bảng `sessions` nếu chưa có.
    // Nếu user MySQL không có quyền CREATE TABLE, hãy đặt false và
    // chạy tay file db/sessions.sql (xem hướng dẫn kèm theo).
    createDatabaseTable: true,

    // Dọn session hết hạn: mỗi 10 phút quét 1 lần (session giờ chỉ sống 2h
    // nên quét thường xuyên hơn bản cũ để không giữ rác quá lâu).
    clearExpired:       true,
    checkExpirationInterval: 1000 * 60 * 10,
    expiration:         1000 * 60 * 60 * 2,  // 2 tiếng, khớp với maxAge của cookie ở server.js

    schema: {
      tableName: 'sessions',
      columnNames: {
        session_id: 'session_id',
        expires:    'expires',
        data:       'data',
      },
    },
  });

  /* Nếu MySQL trục trặc, chỉ ghi log — KHÔNG để nó làm sập server.
     Cùng tinh thần với process.on('unhandledRejection') trong server.js. */
  store.on('error', (err) => {
    console.error('❌ Lỗi session store (MySQL):', err.message);
  });

  return store;
}

module.exports = { createSessionStore };
