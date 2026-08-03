# Hướng phát triển: Nhắc nhở định kỳ qua Outlook cho người phụ trách dự án

## 1. Mục tiêu

Gửi email nhắc nhở tự động qua Outlook vào **9h00 sáng thứ 2 và thứ 5 hàng tuần**, tới người phụ trách của từng dự án, dựa trên dữ liệu lưu trong DB (không nhập tay danh sách nhận).

## 2. Hiện trạng dữ liệu — điểm nghẽn cần xử lý trước

Đã rà lại schema (`db/schema.sql`) và thấy 2 lỗ hổng chặn thẳng hướng đi này:

1. **Bảng `projects` không có cột "người phụ trách dự án"**. Hiện tại chỉ có `assignee` ở cấp **item** (hạng mục công việc), không có ở cấp **project**. Tức là hệ thống đang biết "ai phụ trách hạng mục X" chứ chưa biết "ai phụ trách dự án Y".
2. **Bảng `users` không có cột email**. Có `username`, `ma_nhan_vien`, `chuc_danh`, `phong_ban`, `don_vi` nhưng không có địa chỉ mail để gửi.

=> Trước khi làm phần lịch/gửi mail, bắt buộc phải bổ sung dữ liệu.

### 2.1 Email — đã có sẵn từ API SmartEVN, chỉ chưa được lưu

Đã kiểm tra `services/smartevn.service.js:4-8` — docstring API `/auth/login` xác nhận response trả về:

```
{ authenticated: true, user: { username, hoTen, chucDanh, maNhanVien, email, ... } }
```

**API SmartEVN có trả `email` sẵn.** Nhưng hiện tại `evnLogin.service.js:taoHoacDongBo()` (dòng 31-58) chỉ trích `username, hoTen, maNhanVien, chucDanh, phongBan, donVi` — bỏ qua `email` — và `user.repo.js` (`insertEvn`, `syncEvnInfo`) cũng chưa có cột để lưu. Không cần tích hợp gì thêm, chỉ cần:
1. Thêm cột `users.email`.
2. Sửa `evnLogin.service.js` lấy thêm `evnUser.email`, và `user.repo.js` lưu/đồng bộ nó — giống hệt cách đang làm với `chucDanh`/`phongBan`.

Cần lưu ý: nên xác nhận domain email trả về lúc đăng nhập thật có phải mail nội bộ nhận được qua Outlook không (không phải mail cá nhân) trước khi dùng để gửi nhắc nhở.

### 2.2 Người phụ trách dự án — lấy từ người tạo dự án lúc đăng nhập

**Chọn hướng: gán tự động `manager_user_id = req.session.user.id` ngay khi tạo dự án**, không cần dropdown chọn thủ công.

Đã kiểm tra `routes/api.js:29` — route tạo dự án gọi `projectService.tao(req.session.user, req.body)`, nghĩa là thông tin người đang đăng nhập (kèm `id`) đã có sẵn ngay tại điểm tạo dự án, không cần lấy thêm ở đâu khác.

- Ưu điểm: không tốn thêm UI, không có nguy cơ nhập sai/bỏ trống; nhất quán vì người phụ trách dự án chính là người khởi tạo nó.
- Cân nhắc cần chốt: nếu sau này dự án cần chuyển giao cho người khác phụ trách (người tạo nghỉ việc/đổi phòng ban...), vẫn nên có ô "Người phụ trách" sửa được trong form sửa dự án (không bắt buộc lúc tạo) để không bị khoá cứng vĩnh viễn theo người tạo.

### Thay đổi schema đề xuất (migration mới, đặt tại `db/migrations/`)

```sql
ALTER TABLE projects
  ADD COLUMN manager_user_id INT NULL AFTER budget,
  ADD CONSTRAINT fk_projects_manager
    FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE users
  ADD COLUMN email VARCHAR(150) NULL AFTER don_vi;
```

- `manager_user_id`: gán tự động trong `projectService.tao()` bằng `nguoiDung.id` (tham số đầu, đã là `req.session.user`) — xem `services/project.service.js:47` (`projectRepo.insert(chuanHoaDuAn(f))`), cần truyền thêm field này vào `insert()`. Cho phép sửa lại ở form sửa dự án (không dropdown chọn *lúc tạo*, chỉ cho đổi *sau này* nếu cần).
- `email`: đồng bộ tự động từ SmartEVN như mục 2.1. Với user local (không qua SSO) thì cần ô nhập email thủ công trong màn quản trị người dùng.

## 3. Phương án gửi mail qua Outlook

Công ty dùng hệ sinh thái Microsoft (SmartEVN/EVN thường trên Microsoft 365). Có 2 lựa chọn kỹ thuật:

| Phương án | Cách hoạt động | Khi nào chọn |
|---|---|---|
| **Microsoft Graph API** (`/users/{id}/sendMail`) | App đăng ký trên Azure AD (App Registration), xin quyền `Mail.Send` (application permission), lấy token bằng client credentials flow, gọi REST API | **Khuyến nghị** nếu công ty dùng Microsoft 365/Exchange Online — không cần user đăng nhập, chạy nền hoàn toàn |
| **SMTP qua Exchange/Office365** (dùng `nodemailer` với `smtp.office365.com:587`) | Cấu hình 1 tài khoản dịch vụ (service account) với mật khẩu hoặc app password | Đơn giản, nhanh triển khai, nhưng Microsoft đang siết Basic Auth cho SMTP (nhiều tenant đã tắt) — rủi ro bị chặn về sau |

**Đề xuất: Microsoft Graph API.** Bền hơn, đúng chuẩn "gửi qua Outlook" cấp tổ chức, không phụ thuộc mật khẩu 1 tài khoản cụ thể. Cần phối hợp với bộ phận IT/hạ tầng để:
- Đăng ký App trên Azure AD, cấp quyền **Application permission: `Mail.Send`** (admin consent).
- Lấy `TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET` (hoặc certificate) → lưu vào `config.js`/biến môi trường, **không commit vào git**.
- Chọn 1 mailbox gửi đi (vd. `pman-noreply@evn...`) hoặc gửi thay mặt người dùng cụ thể.

## 4. Kiến trúc đề xuất

Bám theo cấu trúc hiện có của dự án (routes → services → repositories):

```
services/
  reminder.service.js     # gom dữ liệu: dự án nào cần nhắc, ai phụ trách, nội dung gì
  outlookMail.service.js  # gọi Microsoft Graph API để gửi mail (auth token + sendMail)
jobs/
  reminderJob.js          # lịch chạy (cron), gọi reminder.service rồi outlookMail.service
```

### 4.1 Lịch chạy định kỳ

Dùng thư viện `node-cron` (nhẹ, không cần hạ tầng ngoài, phù hợp app Node đang chạy liên tục trên IIS/iisnode như thấy có `web.config`, `iisnode/`).

```js
// jobs/reminderJob.js
const cron = require('node-cron');
const reminderService = require('../services/reminder.service');

// Thứ 2 và thứ 5, 9h00 sáng, giờ Việt Nam
cron.schedule('0 9 * * 1,4', () => reminderService.guiNhacNhoDinhKy(), {
  timezone: 'Asia/Ho_Chi_Minh',
});
```

Lưu ý: cần khởi tạo job này 1 lần khi server start (`server.js`), tránh đăng ký lại mỗi request.

**Rủi ro cần lường trước với iisnode:** iisnode có thể tắt/tái khởi động tiến trình Node khi idle (idle timeout) → cron job trong tiến trình sẽ không chạy đúng giờ nếu app đang "ngủ". Cần kiểm tra cấu hình `web.config` (`iisnode` `idleTimeout`, `recycleOnConfigChange`...) hoặc cân nhắc dùng **Windows Task Scheduler** gọi 1 endpoint nội bộ (`POST /internal/reminders/run`) vào đúng 9h00 thứ 2/thứ 5 thay vì cron trong tiến trình — đáng tin cậy hơn trên IIS.

### 4.2 Luồng xử lý (`reminder.service.js`)

1. Lấy danh sách dự án đang hoạt động (`projectRepo.findAllActive()`), join thêm `manager_user_id` → email qua `userRepo`.
2. Với mỗi dự án, tính các chỉ số cần nhắc (tái dùng `status.rules.js` đã có sẵn: `demQuaHan`, `demChamTienDo`...) — nhắc về hạng mục quá hạn, chậm tiến độ, sắp tới hạn.
3. Bỏ qua dự án không có `manager_user_id` hoặc người phụ trách không có `email` — ghi log cảnh báo (để admin biết cần bổ sung dữ liệu), **không throw lỗi làm dừng cả batch**.
4. Gom theo người phụ trách: nếu 1 người phụ trách nhiều dự án, gửi **1 email tổng hợp** thay vì nhiều mail rời — đỡ spam.
5. Gọi `outlookMail.service.js` để gửi.
6. Ghi log kết quả (thành công/thất bại từng người) — có thể tái dùng bảng `audit_log` hiện có (action mới, vd. `'reminder_sent'`) để tra cứu sau này.

### 4.3 Nội dung email (mẫu)

Chủ đề: `[PMAN] Nhắc việc dự án — {ngày}`

Nội dung nên súc tích, đúng tinh thần đã áp dụng cho chatbot (không lan man, số liệu cụ thể):

```
Dự án {tên dự án}:
- {n} hạng mục quá hạn (hạn {ngày}, đã trễ {x} ngày)
- {n} hạng mục chậm tiến độ

Xem chi tiết: {link tới trang dự án trên PMAN}
```

## 5. Việc cần làm (checklist)

1. [ ] Xác nhận với IT/hạ tầng: công ty dùng Microsoft 365 không, xin cấp App Registration + quyền `Mail.Send`.
2. [ ] Migration: thêm `users.email`, `projects.manager_user_id` (mục 2).
3. [ ] Sửa `evnLogin.service.js` + `user.repo.js` để lấy và lưu `email` từ response SmartEVN (mục 2.1).
4. [ ] Sửa `project.service.js`/`project.repo.js` để gán `manager_user_id = nguoiDung.id` tự động lúc tạo dự án; thêm ô "Người phụ trách" (sửa được) trong form sửa dự án (mục 2.2).
5. [ ] Thêm ô nhập email thủ công trong màn quản trị người dùng, cho trường hợp user local không qua SSO.
6. [ ] Cài `node-cron` (nếu chạy cron trong tiến trình) — hoặc thống nhất phương án Windows Task Scheduler gọi endpoint nội bộ (khuyến nghị hơn trên IIS, xem mục 4.1).
7. [ ] Viết `services/outlookMail.service.js` (lấy token Graph API + gửi mail), theo đúng phong cách hiện có: dịch lỗi API sang tiếng Việt như `chat.service.js:dichLoiAPI()`.
8. [ ] Viết `services/reminder.service.js` (gom dữ liệu + gọi mail).
9. [ ] Log kết quả gửi vào `audit_log` hoặc bảng log riêng.
10. [ ] Test thủ công: endpoint nội bộ để kích hoạt gửi ngay (không đợi đúng lịch) khi kiểm thử.

## 6. Câu hỏi cần chốt với người yêu cầu

- Công ty đang dùng Microsoft 365/Exchange Online cho Outlook hay hệ thống mail nội bộ khác? (quyết định Graph API hay SMTP nội bộ)
- 1 dự án có thể có nhiều hơn 1 người phụ trách không, hay chỉ 1 người duy nhất?
- Nội dung nhắc nhở: chỉ hạng mục quá hạn/chậm tiến độ, hay gồm cả việc sắp tới hạn (nhắc trước)?
