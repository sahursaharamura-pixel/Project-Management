# Hướng phát triển: Chức năng gửi mail nhắc nhở (tới hộp thư Outlook người dùng)

## 0. Tiền đề đã sẵn sàng (đã làm ở giai đoạn trước)

- `users.email` đã có và đã xác nhận **có dữ liệu thật** — vd. `thongbt@evngenco2.vn` tự động lấy từ SmartEVN, không cần nhập tay.
- `projects.manager_user_id` đã có, tự gán bằng người tạo dự án lúc tạo mới.
- Domain email xác nhận là `@evngenco2.vn` — tổ chức dùng email công ty riêng (không phải @gmail...). Cần xác nhận thêm với IT: đây có phải Microsoft 365/Exchange Online không (quyết định phương án gửi mail ở mục 2).
- 3 dự án cũ (tạo trước khi có tính năng) cần được gán tay `manager_user_id` — xem `huong-phat-trien/buoc-trien-khai-db.md` mục 5, làm trước khi bật tính năng gửi mail thật.

## 1. Phạm vi tính năng

- Gửi mail nhắc nhở **định kỳ**: thứ 2 và thứ 5 hàng tuần, 9h00 sáng (giờ Việt Nam).
- Người nhận: người phụ trách của từng dự án (`projects.manager_user_id` → `users.email`).
- Nội dung: các hạng mục quá hạn / chậm tiến độ trong dự án họ phụ trách (tái dùng logic đã có ở `status.rules.js`).
- 1 người phụ trách nhiều dự án → gộp thành **1 mail duy nhất** liệt kê theo từng dự án, tránh gửi rời từng dự án.

## 2. Phương án gửi mail — SMTP qua mailbox Gmail riêng (đã chốt)

Ban đầu định dùng Microsoft Graph API (cần IT cấp App Registration trên Azure AD của công ty — thủ tục dài, phụ thuộc người khác). Đã đổi hướng:

**"Gửi qua Outlook" nghĩa là mail tới được hộp thư Outlook/Exchange của người nhận (`@evngenco2.vn`), không bắt buộc nơi gửi cũng phải là Outlook.** Email hoạt động qua giao thức chuẩn (SMTP) — gửi từ Gmail tới Outlook hoạt động bình thường như gửi mail thông thường giữa 2 tổ chức khác nhau, không có ràng buộc kỹ thuật nào.

=> **Chọn: tạo 1 mailbox Gmail riêng dạng "no-reply" cho web** (vd. `pman.noreply@gmail.com`), dùng làm địa chỉ gửi đi — không phải mail cá nhân đang dùng hằng ngày. Không cần xin quyền IT, tự làm được toàn bộ:

1. Tạo tài khoản Gmail mới, đặt tên dạng `...noreply@gmail.com` (chỉ dùng để gửi, không ai check hộp thư đến của tài khoản này).
2. Bật xác minh 2 bước (2-Step Verification) cho tài khoản đó — Google **bắt buộc** phải bật 2FA thì mới tạo được App Password.
3. Vào **Google Account → Security → App passwords**, tạo 1 App Password riêng cho "Mail" (chuỗi 16 ký tự, khác với mật khẩu đăng nhập Gmail thường).
4. Dùng App Password đó (không phải mật khẩu Gmail thường — mật khẩu thường bị Google chặn cho SMTP bên thứ 3) trong cấu hình `nodemailer`.

**Lưu ý về "no-reply"**: Gmail miễn phí không có cơ chế chặn cứng người khác trả lời — nếu ai đó bấm Reply, mail vẫn kỹ thuật gửi được tới hộp thư đó, chỉ là không ai đọc. Đó là quy ước qua tên tài khoản (`...noreply@...`) và tên hiển thị, không phải khóa thật. Nếu muốn chặt hơn — người nhận bấm Reply thì mail tự chuyển tới 1 người có theo dõi thay vì thất lạc — set thêm header `Reply-To` trỏ tới email đó (mục 4.1, dòng comment `replyTo`).

Ưu điểm: setup trong vài phút, không phụ thuộc IT/Azure AD, `nodemailer` hỗ trợ sẵn Gmail rất tốt (`service: 'gmail'`).
Đánh đổi: mail gửi từ 1 tài khoản Gmail thay vì domain công ty — về lâu dài nếu muốn "chuyên nghiệp" hơn (tránh vào mục Spam) vẫn có thể chuyển sang Graph API sau này mà không phải viết lại `reminder.service.js`, chỉ thay `outlookMail.service.js`.

## 3. Cần cài thêm

```
npm install node-cron nodemailer
```

`nodemailer` — thư viện SMTP phổ biến nhất cho Node, hỗ trợ sẵn cấu hình Gmail (`service: 'gmail'`).

## 4. Cấu trúc code đề xuất

```
services/
  reminder.service.js     # gom dữ liệu: dự án nào cần nhắc, ai phụ trách, nội dung gì
  outlookMail.service.js  # gửi mail qua SMTP Gmail (nodemailer)
jobs/
  reminderJob.js          # đăng ký lịch chạy (node-cron), gọi reminder.service
routes/
  (thêm 1 route nội bộ để admin có thể bấm gửi thử ngay, không cần đợi đúng lịch)
```

### 4.1 `outlookMail.service.js`

```js
/* Gửi mail nhắc nhở qua SMTP (mailbox Gmail riêng của web, xem
   huong-phat-trien/gui-mail-nhac-nho.md mục 2 để biết cách tạo App Password).
   Theo đúng phong cách smartevn.service.js: chỉ nói chuyện với dịch vụ ngoài,
   không đụng DB. */
const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.MAIL_SENDER_ADDRESS,   // vd. pman.noreply@gmail.com
    pass: config.MAIL_SENDER_APP_PASSWORD, // App Password 16 ký tự, KHÔNG phải mật khẩu Gmail thường
  },
});

/* Gửi 1 mail, danh sách người nhận là mảng email string. */
async function guiMail({ toList, subject, bodyHtml }) {
  await transporter.sendMail({
    from:    `"PMAN - Nhắc việc dự án (không phản hồi)" <${config.MAIL_SENDER_ADDRESS}>`,
    to:      toList.join(', '),
    subject,
    html:    bodyHtml,
    // Tuỳ chọn: nếu muốn người nhận bấm Reply thì mail chuyển tới người có
    // theo dõi thay vì thất lạc vào hộp thư noreply không ai đọc, bỏ comment:
    // replyTo: config.MAIL_REPLY_TO_ADDRESS,
  });
}

module.exports = { guiMail };
```

### 4.2 `reminder.service.js`

```js
/* Gom dữ liệu dự án theo người phụ trách, tính chỉ số cần nhắc,
   gọi outlookMail để gửi. Lỗi 1 người không được làm dừng cả batch. */
const projectRepo = require('../repositories/project.repo');
const itemRepo    = require('../repositories/item.repo');
const userRepo    = require('../repositories/user.repo');
const rules       = require('./status.rules');
const outlookMail = require('./outlookMail.service');

async function guiNhacNhoDinhKy() {
  const [projects, items] = await Promise.all([
    projectRepo.findAllActive(),
    itemRepo.findAll(),
  ]);

  // Gom theo manager_user_id, bỏ qua dự án chưa có người phụ trách
  const theoNguoiPhuTrach = new Map();
  for (const p of projects) {
    if (!p.manager_user_id) continue;
    const hangMuc = items.filter(i => i.project_id === p.id);
    const quaHan  = rules.demQuaHan(hangMuc);
    const chamTienDo = rules.demChamTienDo(hangMuc);
    if (quaHan === 0 && chamTienDo === 0) continue;  // dự án ổn, không cần nhắc

    const list = theoNguoiPhuTrach.get(p.manager_user_id) || [];
    list.push({ project: p, quaHan, chamTienDo });
    theoNguoiPhuTrach.set(p.manager_user_id, list);
  }

  const ketQua = [];
  for (const [managerId, danhSachDuAn] of theoNguoiPhuTrach) {
    const nguoi = await userRepo.findById(managerId);
    if (!nguoi?.email) {
      ketQua.push({ managerId, ok: false, ly_do: 'Chưa có email' });
      continue;
    }
    try {
      await outlookMail.guiMail({
        toList: [nguoi.email],
        subject: `[PMAN] Nhắc việc dự án — ${new Date().toLocaleDateString('vi-VN')}`,
        bodyHtml: taoNoiDungMail(danhSachDuAn),
      });
      ketQua.push({ managerId, ok: true });
    } catch (e) {
      ketQua.push({ managerId, ok: false, ly_do: e.message });
    }
  }
  return ketQua;
}

function taoNoiDungMail(danhSachDuAn) {
  const phan = danhSachDuAn.map(({ project, quaHan, chamTienDo }) => `
    <p><b>${project.name}</b><br>
    ${quaHan ? `${quaHan} hạng mục quá hạn<br>` : ''}
    ${chamTienDo ? `${chamTienDo} hạng mục chậm tiến độ<br>` : ''}
    </p>`).join('');
  return `<div>${phan}<p><a href="${'{URL_PMAN}'}">Xem chi tiết trên PMAN</a></p></div>`;
}

module.exports = { guiNhacNhoDinhKy };
```

### 4.3 `jobs/reminderJob.js`

```js
const cron = require('node-cron');
const reminderService = require('../services/reminder.service');

function batDauLich() {
  // Thứ 2 và thứ 5, 9h00 sáng, giờ Việt Nam
  cron.schedule('0 9 * * 1,4', async () => {
    try {
      await reminderService.guiNhacNhoDinhKy();
    } catch (e) {
      console.error('[reminderJob] Lỗi gửi nhắc nhở định kỳ:', e.message);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });
}

module.exports = { batDauLich };
```

Gọi `batDauLich()` 1 lần trong `server.js` lúc khởi động (sau khi `initDB()` xong).

### 4.4 Route test thủ công (chỉ admin)

Cần 1 endpoint để bấm gửi thử ngay, không phải đợi đúng 9h sáng thứ 2/thứ 5 mới biết có lỗi hay không:

```js
// routes/api.js (hoặc file route riêng)
router.post('/admin/reminders/run-now', requireAdmin, ah(async (req, res) => {
  const ketQua = await reminderService.guiNhacNhoDinhKy();
  res.json({ ketQua });
}));
```

## 5. Lưu ý triển khai trên IIS

App chạy qua `iisnode` có thể bị **idle-recycle** khi không có traffic một thời gian — lúc đó `node-cron` đang chạy trong tiến trình sẽ ngừng theo, và có thể bỏ lỡ đúng khung giờ 9h00 nếu app đang "ngủ".

Khuyến nghị (chọn 1):
- **A. Giữ app luôn "thức"**: cấu hình `iisnode` `idleTimeout` đủ dài (hoặc tắt idle), chấp nhận tốn tài nguyên hơn. Đơn giản, ít thay đổi.
- **B. Windows Task Scheduler gọi endpoint nội bộ đúng giờ**: tạo task chạy `curl`/`Invoke-WebRequest` gọi `POST /internal/reminders/run` vào 9h00 thứ 2 và thứ 5 — không phụ thuộc app có đang "thức" hay không tại thời điểm đó (request tới sẽ tự đánh thức iisnode). **Đáng tin cậy hơn**, khuyến nghị dùng cách này thay vì dựa hoàn toàn vào `node-cron`.

Nếu chọn B: `reminderJob.js` không cần thiết nữa, chỉ cần route ở mục 4.4, bảo vệ bằng 1 secret token nội bộ (không phải `requireAdmin` vì Task Scheduler không đăng nhập được) — vd. kiểm tra header `X-Internal-Key` khớp với 1 giá trị bí mật trong `config.js`.

## 6. Ghi log kết quả gửi

Tái dùng bảng `audit_log` có sẵn — mỗi lần chạy job, ghi 1 dòng tổng kết (vd. `action: 'reminder_sent'`, `detail: 'Gửi 4/5 người, 1 lỗi: ...'`) để admin xem lại trong màn "Lịch sử thay đổi" hiện có, không cần bảng log riêng.

## 7. Việc cần làm (checklist)

1. [ ] Tạo tài khoản Gmail riêng cho web (vd. `pman.thongbao@gmail.com`), bật 2-Step Verification, tạo App Password (mục 2).
2. [ ] Gán tay `manager_user_id` cho 3 dự án cũ (xem `buoc-trien-khai-db.md` mục 5).
3. [ ] Thêm biến cấu hình vào `config.js`: `MAIL_SENDER_ADDRESS`, `MAIL_SENDER_APP_PASSWORD` — **không commit giá trị thật vào git**.
4. [ ] `npm install node-cron nodemailer`.
5. [ ] Viết `services/outlookMail.service.js`, `services/reminder.service.js` theo mục 4.
6. [ ] Chọn phương án lịch chạy (mục 5): `node-cron` trong app, hay Windows Task Scheduler gọi endpoint nội bộ (khuyến nghị).
7. [ ] Thêm route test thủ công cho admin (mục 4.4).
8. [ ] Ghi log kết quả vào `audit_log` (mục 6).
9. [ ] Test thật: bấm route test, kiểm tra mail có tới hộp thư Outlook thật không (dùng chính tài khoản `thongbt@evngenco2.vn` để tự kiểm tra) — kiểm tra cả mục Spam/Junk vì mail lần đầu từ địa chỉ Gmail mới có thể bị lọc.

## 8. Câu hỏi cần chốt trước khi code

- Tên hiển thị mong muốn cho người gửi là gì? (vd. "PMAN - Nhắc việc dự án" hay tên khác)
- Ngưỡng "cần nhắc" là gì — chỉ cần ≥1 hạng mục quá hạn/chậm tiến độ đã gửi, hay cần ngưỡng số ngày trễ tối thiểu để tránh nhắc quá thường xuyên với lỗi nhỏ?
- Nếu mail từ Gmail mới bị vào Spam ở phía người nhận (Outlook công ty) — có cần nhờ IT thêm địa chỉ Gmail đó vào danh sách an toàn (safe sender) trên hệ thống lọc mail công ty không?
