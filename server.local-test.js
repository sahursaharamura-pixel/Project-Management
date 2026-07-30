/* ══════════════════════════════════════════════════════════════
   SERVER TEST CỤC BỘ — CHỈ DÙNG ĐỂ XEM THỬ 2 TRANG "ĐỊNH HƯỚNG KHCN"
   VÀ "KH SXKD" TRÊN MÁY CÁ NHÂN, KHÔNG CẦN CÀI/KẾT NỐI MYSQL.

   Khác với server.js (server thật, chạy trên IIS, bắt buộc có MySQL vì
   toàn bộ phần Dashboard/Dự án/Đăng nhập thật đều dùng MySQL), file này:
     - KHÔNG gọi initDB() / không cần MySQL chạy được
     - Giả lập luôn 1 phiên "đã đăng nhập" (để nút Thêm/Sửa/Xóa trên 2
       trang KHCN & SXKD hoạt động được, vì API lưu yêu cầu đăng nhập)
     - Mount toàn bộ routes/api.js như bình thường — riêng các API khác
       (Dashboard, Dự án...) vẫn gọi được route nhưng sẽ báo lỗi vì
       không có MySQL, đó là bình thường, không phải lỗi của 2 trang mới.

   CÁCH DÙNG:
     1. npm install (nếu máy test chưa có node_modules)
     2. node server.local-test.js
     3. Mở trình duyệt: http://localhost:3001
     4. Vào sidebar bấm "Định hướng KHCN" hoặc "KH SXKD" để test

   ⚠️ CHỈ dùng để test cục bộ. KHÔNG deploy file này lên server thật —
   trên server vẫn chạy "node server.js" như cũ (có MySQL đầy đủ). */

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Giả lập 1 tài khoản đã đăng nhập cho MỌI request, để nút Thêm/Sửa/Xóa
   trên trang KHCN/SXKD (yêu cầu requireAuth) hoạt động được khi test —
   không cần bấm đăng nhập thật, không cần MySQL để xác thực. */
app.use((req, res, next) => {
  req.session = {
    user: { id: 1, username: 'test-local', name: 'Người dùng test (cục bộ)', role: 'admin' },
  };
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', require('./routes/api')());
// Không mount routes/auth.js và routes/chat.js vì cả 2 đều cần MySQL/API key
// và không cần thiết để test riêng 2 trang KHCN/SXKD.

app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err && err.status) return res.status(err.status).json({ error: err.message });
  console.error('❌ Lỗi API (test cục bộ):', err);
  res.status(500).json({ error: 'Đã xảy ra lỗi hệ thống, vui lòng thử lại' });
});

app.listen(PORT, () => {
  console.log(`\n✅ Server TEST CỤC BỘ (không cần MySQL) đang chạy: http://localhost:${PORT}`);
  console.log(`   Vào sidebar bấm "Định hướng KHCN" hoặc "KH SXKD" để test Thêm/Sửa/Xóa.`);
  console.log(`   Các trang khác (Dashboard, Dự án...) sẽ báo lỗi vì không có MySQL — đó là bình thường.\n`);
});
