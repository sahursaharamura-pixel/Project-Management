const mysql  = require('mysql2/promise');
const config = require('../config');

let _pool = null;

function getPool() {
  if (_pool) return _pool;
  _pool = mysql.createPool({
    host:     config.DB_HOST,
    port:     config.DB_PORT,
    user:     config.DB_USER,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });
  return _pool;
}

/* Chạy 1 câu SQL, trả về rows.
   Dùng pool.query() (không phải execute()) để hỗ trợ mở rộng mảng cho IN (?) */
async function query(sql, params) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}

module.exports = { getPool, query };
