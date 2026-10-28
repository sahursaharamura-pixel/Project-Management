const express = require('express');
const session = require('express-session');
const path    = require('path');
const { initDB } = require('./db/init');
const { createSessionStore } = require('./db/sessionStore');
const { AppError } = require('./utils/AppError');
const { batDauLich } = require('./jobs/reminderJob');
const config  = require('./config');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true); // để req.ip lấy đúng IP client khi chạy sau IIS/reverse proxy

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const HAI_GIO_MS = 1000 * 60 * 60 * 2; // 2 tiếng — thời gian tối đa không thao tác trước khi tự đăng xuất

app.use(session({
  secret: config.SESSION_SECRET,
  store: createSessionStore(),        // GĐ1: lưu ở MySQL, không phải RAM
  resave: false,
  saveUninitialized: false,
  rolling: true,                      // mỗi request hợp lệ -> gia hạn thêm 2h (không bị văng giữa lúc đang dùng)
  cookie: {
    maxAge:   HAI_GIO_MS,              // 2 tiếng không thao tác -> tự đăng xuất
    httpOnly: true,
    sameSite: 'lax',
    // secure: true -> chỉ bật khi chạy HTTPS
  },
}));

/* report.html là trang tĩnh mở tab riêng (target="_blank"), không đi qua app SPA
   nên không có cơ chế 401 -> mở modal đăng nhập. Chặn thẳng ở đây trước khi
   static middleware phục vụ file, để khách chưa đăng nhập không xem được báo cáo. */
app.get('/report.html', (req, res, next) => {
  if (!req.session || !req.session.user) return res.redirect('/');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/auth')());
app.use('/api', require('./routes/api')());
app.use('/api', require('./routes/chat')(config.CLAUDE_API_KEY));

app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));

/* Middleware xử lý lỗi tập trung (phải đặt cuối, đủ 4 tham số).
   - AppError do tầng service throw -> trả đúng mã HTTP + thông báo của nó.
   - Lỗi còn lại (kể cả lỗi MySQL) -> 500 chung, không lộ chi tiết ra ngoài.
   Body giữ nguyên định dạng cũ: { error: "..." } */
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  console.error('❌ Lỗi API:', err);
  res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại' });
});

process.on('unhandledRejection', err => {
  console.error('❌ Unhandled rejection (đã ngăn server sập):', err);
});

initDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Đang chạy: http://localhost:${PORT}`);
      console.log(`   Truy cập nội bộ: http://<IP_MÁY_CHỦ>:${PORT}\n`);
    });
    /* Nếu chuyển sang dùng Windows Task Scheduler gọi /api/internal/reminders/run
       (xem huong-phat-trien/gui-mail-nhac-nho.md mục 5), XOÁ dòng dưới để
       tránh gửi trùng 2 lần (1 lần từ cron trong tiến trình, 1 lần từ Task Scheduler). */
    batDauLich();
  })
  .catch(e => {
    console.error('❌ Không thể khởi tạo cơ sở dữ liệu MySQL:', e.message);
    process.exit(1);
  });
