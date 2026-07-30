# RÀ SOÁT HỆ THỐNG QUẢN LÝ DỰ ÁN (pman)
### Chuẩn bị bảo vệ trước lãnh đạo — Rà soát ngày 30/07/2026 (cập nhật sau khi xử lý các mục ưu tiên)

Đối chiếu: mã nguồn thư mục làm việc hiện tại (`d:\KHCN&CĐS\Linh tinh\pman-clean`) và *Hướng dẫn xây dựng, nâng cấp, bảo trì các sản phẩm phần mềm trong Tập đoàn Điện lực Quốc gia Việt Nam* (QĐ-EVN, 10/2023).

**Lưu ý:** thư mục làm việc hiện tại **không phải là git repository** (không có `.git`). Các nhận định về "lịch sử git" trong bản rà soát gốc không kiểm chứng được ở đây và đã được loại bỏ/điều chỉnh trong bản cập nhật này.

---

## 1. TÓM TẮT CHO LÃNH ĐẠO

So với bản rà soát lần đầu, phần lớn các vấn đề nghiêm trọng đã được xử lý trực tiếp trong đợt rà soát này: bổ sung xác thực cho các endpoint đọc dữ liệu, vá lỗ hổng XSS ở `app.js`, và bổ sung cột còn thiếu trong `schema.sql` kèm migration. Các file bí mật (`config.js.bak`, `config-old.js`) và các file rác `.bak` được nêu trong báo cáo gốc **không tồn tại trong thư mục hiện tại** — có thể đã được dọn trước đó, nhưng cần xác nhận lại với `git log` một khi thư mục này được đưa vào quản lý phiên bản.

**Đề xuất:** hoàn tất phần còn lại (mục 4, mục 5 dưới đây — kiểm thử tự động, tài liệu, cứng hoá bảo mật) trước buổi bảo vệ nếu còn thời gian.

---

## 2. ĐÃ XỬ LÝ TRONG ĐỢT RÀ SOÁT NÀY (30/07/2026)

| # | Vấn đề | Xử lý |
|---|---|---|
| 1 | `POST /api/chat` không có `requireAuth` — người lạ chưa đăng nhập có thể hỏi trợ lý AI về toàn bộ dữ liệu dự án, tốn phí API mỗi lượt hỏi | Đã thêm `requireAuth` cho riêng `/api/chat` (`routes/chat.js`). **Cố ý giữ nguyên không cần đăng nhập** cho các endpoint GET phục vụ xem dashboard/báo cáo (`/api/stats`, `/api/projects`, `/api/items`, `/api/projects/:id/detail`, `/api/archives`, `/api/archives/:id/export`, `/api/khcn-data`, `/api/sxkd-data`) — đây là quyết định nghiệp vụ: lãnh đạo và người dùng nội bộ cần xem được dashboard tiến độ dự án, KHCN, KH SXKD ngay mà không phải đăng nhập; chỉ các thao tác **nhập liệu/sửa/xóa/báo cáo** (POST/PUT/DELETE) mới yêu cầu đăng nhập |
| 2 | XSS: `public/js/app.js` chèn dữ liệu người dùng (`item.name`, `group_name`, `note`, `assignee`, `noi_dung`…) qua `innerHTML` không lọc ký tự đặc biệt | Đã thêm hàm `esc()` (sao từ `report.js`) và bọc toàn bộ các điểm nội suy dữ liệu người dùng trong template string — hơn 30 vị trí trong `app.js` |
| 3 | `db/schema.sql` bảng `users` thiếu cột `auth_source, ma_nhan_vien, chuc_danh, phong_ban, don_vi` mà `repositories/user.repo.js` vẫn đọc/ghi | Đã bổ sung các cột vào `schema.sql`, đồng thời cho phép `password_hash` NULL (tài khoản SmartEVN không có mật khẩu local). Đã tạo `db/migrations/001_add_evn_sso_columns.sql` cho các CSDL đã triển khai từ schema cũ (idempotent, dùng `information_schema` để kiểm tra trước khi ALTER) |

**Chưa kiểm thử được bằng cách dựng CSDL từ số 0** trong phiên làm việc này (không xác nhận được MySQL server đang chạy sẵn với thông tin đăng nhập phù hợp) — **nên tự chạy `mysql -u root -p pman_test < db/schema.sql` trên môi trường sạch trước buổi bảo vệ để xác nhận.**

## 3. KHÔNG CÒN TÌM THẤY TRONG THƯ MỤC HIỆN TẠI (có thể đã xử lý trước đó — cần xác nhận)

| Mục trong báo cáo gốc | Kết quả kiểm tra lại |
|---|---|
| `config.js.bak` chứa khóa API Anthropic thật, mật khẩu MySQL sản xuất | Không tìm thấy file `.bak`/`-old` nào trong thư mục. Chỉ có `config.js`. **Không có `.gitignore`** — nếu thư mục này được đưa vào git, cần tạo `.gitignore` (`config*.js` trừ `config.example.js`, `*.bak`, `node_modules/`, `iisnode/`, `data.json*`) trước khi commit lần đầu, để tránh lặp lại sự cố |
| `config-old.js` chứa mật khẩu root MySQL | Không tìm thấy |
| Trang KHCN (`public/js/khcn.js`) chỉ là dữ liệu viết cứng, mất khi F5 | **Đã có persistence thật**: `khcn.js` gọi `fetch('/api/khcn-data')` (GET/PUT), lưu ở `data/khcn-data.json` qua `khcnSxkd.service.js`, route đã có `requireAuth` trên thao tác ghi |
| File `.bak` rác (`app.js.bak`, `auth.js.bak`, `main.css.bak`, `index.html.bak`, `server.js.bak`, `web.config.bak`) | Không tìm thấy |
| `data.json.pre-mysql-backup` | Không tìm thấy |
| `CHAY_NGAY.txt`, `DEPLOY_IIS_UPDATE.txt` | Không tìm thấy (chỉ có `db/DEPLOY_REMOTE_MYSQL.txt`) |

**Vẫn còn trên đĩa, cần dọn trước khi đưa vào git (nếu repo sẽ dùng git):** `node_modules/` (thư viện bên thứ ba, không nên commit), `iisnode/*.txt` (~20 file log vận hành), `data.json` (dữ liệu vận hành, không phải mã nguồn).

---

## 4. VẤN ĐỀ QUAN TRỌNG — NÊN LÀM TRƯỚC KHI TRIỂN KHAI RỘNG

### 🟠 4.1 — Hiệu năng: mọi truy vấn đều `SELECT *` toàn bảng

`repositories/item.repo.js` — `findAll()` (dòng 4) chạy `SELECT * FROM items` không `WHERE`/`LIMIT`; `services/item.service.js` (dòng 56-76, `danhSach()`) lọc theo `project_id`/`status`/từ khóa tìm kiếm **bằng JavaScript sau khi đã nạp hết**. `dongBoTrangThai()` (dòng 12-23) vẫn `UPDATE` từng dòng trong vòng lặp thay vì gộp thành 1 câu lệnh.

Chưa gây ảnh hưởng vì dữ liệu còn ít, nhưng sẽ chậm rõ rệt khi tới vài nghìn hạng mục.

**Xử lý:** đẩy `WHERE`/`LIMIT`/`OFFSET` xuống SQL; gộp `dongBoTrangThai` thành 1 câu `UPDATE ... CASE WHEN` hoặc tính trạng thái bằng view.

### 🟠 4.2 — Chưa có kiểm thử tự động

Không có thư mục `test/`, không có framework kiểm thử, `package.json` không có script `test`. Thư mục `test-db/` chỉ là script thử kết nối thủ công.

Hướng dẫn EVN có Điều 20 (Hoạt động đảm bảo chất lượng phát triển phần mềm) và Điều 17 (hồ sơ tài liệu nghiệm thu) — khả năng cao sẽ bị hỏi.

**Chi phí thấp, hiệu quả cao:** `status.rules.js` là hàm thuần, viết unit test rất dễ (nửa ngày là có ~20 test case).

### 🟠 4.3 — Chưa có tài liệu

Không có README, không có tài liệu kiến trúc/API/hướng dẫn sử dụng.

**Xử lý:** chuẩn bị tối thiểu: mô tả kiến trúc, danh mục API, hướng dẫn triển khai, hướng dẫn người dùng — đáp ứng Điều 17.

### 🟠 4.4 — Thiếu các biện pháp bảo vệ tiêu chuẩn

| Thiếu | Rủi ro | Cách xử lý |
|---|---|---|
| Giới hạn số lần đăng nhập | Dò mật khẩu bằng máy | `express-rate-limit` |
| Bảo vệ CSRF | Lợi dụng phiên đăng nhập để thao tác thay người dùng | `csurf` hoặc `sameSite: 'strict'` |
| HTTP header an toàn | Nhiều loại tấn công qua trình duyệt | `helmet` |
| HTTPS | Mật khẩu SmartEVN truyền dạng rõ trên mạng nội bộ | Bật SSL trên IIS, mở `cookie.secure` |
| Ràng buộc dữ liệu đầu vào | Dữ liệu sai/rác vào CSDL | Kiểm tra ở tầng service |
| Khóa ngoại bảng `archives` | Dữ liệu mồ côi | Thêm `FOREIGN KEY` |
| Chỉ mục cho tìm kiếm | Truy vấn chậm khi dữ liệu lớn | Thêm `INDEX` |

---

## 5. NÊN CẢI THIỆN — GHI VÀO LỘ TRÌNH

### 🟡 5.1 — Mô hình phân quyền còn thô

Chỉ có 2 vai trò `admin`/`user`, mọi `user` đều sửa/xóa được mọi dự án của mọi đơn vị.

**Đề xuất lộ trình:** phân quyền theo đơn vị, thêm vai trò "chỉ xem" cho lãnh đạo.

### 🟡 5.2 — Các chức năng nghiệp vụ còn thiếu

- Xuất Excel/PDF báo cáo (hiện chỉ xuất JSON của bản lưu trữ)
- Đính kèm tài liệu vào dự án/hạng mục
- Thông báo/nhắc hạn qua email hoặc trong ứng dụng
- Phụ thuộc giữa các hạng mục — Gantt hiện chỉ vẽ thanh, chưa có đường găng
- So sánh kế hoạch với thực tế (baseline)
- Trọng số hạng mục — tiến độ dự án hiện tính bằng *số hạng mục hoàn thành / tổng số*, chưa theo kinh phí — **điểm lãnh đạo có thể chất vấn**
- Nhật ký kiểm toán chỉ ghi "đã sửa", không ghi giá trị cũ/mới

---

## 6. KẾ HOẠCH ĐỀ XUẤT

### Trước buổi bảo vệ

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Thêm `requireAuth` cho `/api/chat` (dashboard/báo cáo cố ý để công khai xem, chỉ nhập liệu/sửa/xóa mới cần đăng nhập) | ✅ Đã xong (30/07/2026) |
| 2 | Thêm hàm `esc()` chống XSS vào `app.js` | ✅ Đã xong (30/07/2026) |
| 3 | Sửa `schema.sql` + tạo migration cho cột SmartEVN | ✅ Đã xong (30/07/2026) — **cần tự kiểm thử dựng lại từ số 0** |
| 4 | Xác nhận `.gitignore` trước khi đưa thư mục vào git (nếu sẽ dùng git) | ⏳ Chưa làm — hiện chưa có `.git` |
| 5 | Dọn `node_modules`, log `iisnode`, `data.json` khỏi phạm vi commit | ⏳ Chưa làm |
| 6 | Viết unit test cho `status.rules.js` | ⏳ Chưa làm |
| 7 | Viết README + tài liệu kiến trúc | ⏳ Chưa làm |

### Ngay sau buổi bảo vệ

Bật HTTPS · thêm `helmet` + rate-limit + CSRF · xuất báo cáo Excel/PDF · đẩy phân trang xuống SQL

### Lộ trình trung hạn

Phân quyền theo đơn vị · đính kèm tài liệu · thông báo nhắc hạn · trọng số theo kinh phí · so sánh kế hoạch–thực tế · phụ thuộc hạng mục & đường găng

---

## 7. CHUẨN BỊ CHO PHẦN HỎI ĐÁP

**"Dữ liệu có an toàn không? Ai xem được gì?"**
→ Đây là quyết định nghiệp vụ có chủ đích: dashboard tiến độ dự án, trang KHCN, KH SXKD **được để công khai xem** trong mạng nội bộ (không cần đăng nhập) để lãnh đạo và cán bộ tra cứu nhanh, thuận tiện. Chỉ thao tác **nhập liệu, sửa, xóa** và **hỏi trợ lý AI** (`/api/chat`) mới yêu cầu đăng nhập — vì đây là nơi có rủi ro thực chất (thay đổi dữ liệu, hoặc tốn phí/lộ dữ liệu qua chatbot cho người ngoài). Nên nêu rõ ranh giới này nếu bị hỏi, tránh nhầm là "chưa kiểm soát truy cập".

**"Người dùng có thể chèn mã độc qua tên hạng mục không?"**
→ Đã xử lý: `app.js` nay dùng hàm `esc()` để lọc ký tự đặc biệt tại mọi điểm hiển thị dữ liệu người dùng.

**"% tiến độ tính thế nào?"**
→ Hiện là số hạng mục hoàn thành / tổng số, mỗi hạng mục trọng số bằng nhau. Nên nói thẳng hạn chế này và nêu hướng cải tiến theo kinh phí.

**"Đã kiểm thử chưa? Hồ sơ nghiệm thu đâu?"**
→ Cần mục 4.2 và 4.3. Đây là yêu cầu tại Điều 17 và Điều 20 của Hướng dẫn EVN.

**"Chạy được cho bao nhiêu đơn vị, bao nhiêu dự án?"**
→ Cần trung thực: kiến trúc hiện tại nạp toàn bộ dữ liệu mỗi lần truy vấn, phù hợp quy mô vài trăm hạng mục. Đã có phương án tối ưu (mục 4.1).

**"Trợ lý AI có làm lộ dữ liệu ra ngoài không?"**
→ Cần chuẩn bị kỹ: dữ liệu dự án đang được gửi ra `api.anthropic.com` qua `/api/chat` (nay đã yêu cầu đăng nhập). Nên rà soát với quy định về dữ liệu của Tập đoàn, và cân nhắc lọc bớt trường nhạy cảm trước khi gửi.

**"In báo cáo ra được không?"**
→ Hiện chỉ xuất JSON. Nên bổ sung xuất Excel trước buổi bảo vệ nếu còn thời gian.
