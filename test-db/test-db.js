const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: '10.147.0.36',
      user: 'pman_app',
      password: 'jyxlYSsI3fZFEqNq!Bb2',
      database: 'pman'
    });

    const [projects] = await conn.query('SELECT COUNT(*) AS n FROM projects');
    const [items]    = await conn.query('SELECT COUNT(*) AS n FROM items');
    const [users]    = await conn.query('SELECT username, role FROM users');

    console.log('? K?T N?I THÀNH CÔNG');
    console.log('   S? d? án :', projects[0].n);
    console.log('   S? h?ng m?c:', items[0].n);
    console.log('   Users:', users);

    await conn.end();
  } catch (e) {
    console.error('? L?I:', e.message);
  }
})();