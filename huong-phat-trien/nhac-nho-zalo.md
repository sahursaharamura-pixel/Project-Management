# Hướng phát triển: Kênh nhắc nhở thứ 2 qua Zalo

## 0. So với kênh mail — phức tạp hơn đáng kể, cần lường trước

Kênh mail (Gmail SMTP) làm nhanh vì không cần ai duyệt, không giới hạn nội dung. Zalo **không có đường tắt tương tự** — mọi phương án chính thức đều cần đăng ký + được Zalo duyệt trước khi gửi được tin thật. Cần biết trước để không kỳ vọng "làm xong trong ngày" như kênh mail.

## 1. Các phương án Zalo — so sánh

| Phương án | Cách hoạt động | Có cần theo dõi OA không | Duyệt trước | Chi phí | Đánh giá |
|---|---|---|---|---|---|
| **ZNS (Zalo Notification Service)** | Gửi "tin thông báo giao dịch" qua Zalo Official Account (OA) doanh nghiệp, dựa vào **số điện thoại** người nhận | Không cần follow OA | Phải đăng ký OA doanh nghiệp + **duyệt từng mẫu nội dung (template)** trước khi gửi | Tính phí theo tin (xem mục 4) | **Phù hợp nhất** với nhu cầu nhắc nhở tự động, nhưng tốn thời gian setup ban đầu |
| **Tin tư vấn (Consultation message) qua OA** | OA nhắn tự do cho người đã từng nhắn tin/quan tâm OA | **Bắt buộc** người nhận đã tương tác với OA trong 7 ngày gần nhất | Không cần duyệt nội dung | Miễn phí (trong hạn mức) | Không phù hợp — phụ thuộc người nhận phải chủ động nhắn OA trước, không chủ động gửi định kỳ được |
| **Zalo cá nhân (không chính thức)** | Dùng thư viện reverse-engineer để giả lập tài khoản Zalo cá nhân gửi tin | Không | Không | Miễn phí | **Không khuyến nghị** — vi phạm điều khoản dịch vụ Zalo, rủi ro khoá tài khoản bất kỳ lúc nào, không phù hợp hệ thống của tổ chức |

=> Chỉ có **ZNS** là phương án chính thức, ổn định, đáng làm cho hệ thống thật. 2 phương án còn lại loại bỏ.

## 2. Điều kiện cần có trước khi bắt đầu

1. ~~Zalo OA doanh nghiệp đã xác thực~~ — **đã có sẵn**, tên "EVN GENCO2", quản lý qua Zalo Official Account Manager (business.zalo.me). Bỏ được bước xác thực doanh nghiệp mất thời gian nhất.
2. **Tài khoản Zalo Developers** liên kết với OA "EVN GENCO2" — vào **developers.zalo.me**, tạo 1 "Ứng dụng" (App) mới và liên kết với OA này để lấy `app_id`/`secret_key`. Người thao tác phải có quyền quản trị OA (đăng nhập cùng tài khoản đang quản lý OA trong ảnh chụp).
3. **Đăng ký ZNS**: OA phải bật tính năng ZNS (Zalo Notification Service) — thường vào mục **business.openapi.zalo.me** hoặc trong chính Official Account Manager (mục "Tiện ích" hoặc mục riêng cho ZNS) để đăng ký sử dụng, nếu OA chưa từng dùng ZNS trước đó.
4. **Duyệt mẫu tin ZNS**: nội dung tin nhắn phải khai báo trước theo mẫu cố định (giống điền form, có chỗ trống cho biến như `{ten_du_an}`, `{so_hang_muc_qua_han}`...), gửi Zalo duyệt — mất vài ngày, có thể bị từ chối nếu nội dung không đúng chuẩn "giao dịch" (không được mang tính quảng cáo).
5. **Số điện thoại người nhận** — ZNS gửi theo số điện thoại Zalo, không theo email. `users` hiện **chưa có cột số điện thoại**, cần bổ sung tương tự cách đã làm với `email`:
   - Kiểm tra API SmartEVN có trả số điện thoại không (giống cách đã kiểm tra `email` trước đây — xem có field `soDienThoai`/`phone`/`sdt` trong response `/auth/login` không).
   - Nếu không có, cần thêm ô nhập số điện thoại thủ công trong màn quản trị người dùng.

## 3. Thay đổi DB cần thiết (khi bắt tay code)

```sql
ALTER TABLE users ADD COLUMN so_dien_thoai VARCHAR(20) NULL AFTER email;
```

Số điện thoại cần chuẩn hoá đúng định dạng Zalo yêu cầu (thường dạng quốc tế `84xxxxxxxxx`, bỏ số 0 đầu) trước khi gửi — cần viết 1 hàm chuẩn hoá riêng, vì số nhập vào có thể ở dạng `0912345678` hoặc `+84912345678` tuỳ người nhập.

## 4. Chi phí

ZNS tính phí theo tin gửi thành công (không tính tin lỗi/không gửi được), theo bậc thang tuỳ tổng số lượng tin/tháng. **Giá thay đổi theo thời gian và chính sách Zalo — cần tra bảng giá mới nhất trên trang Zalo Developers/Zalo Business trước khi quyết định**, không dùng số liệu cũ đoán mò. Đây là điểm khác biệt lớn với kênh mail (miễn phí hoàn toàn).

## 5. Kiến trúc code đề xuất (khi đã có OA + template được duyệt)

Theo đúng cấu trúc đã dùng cho kênh mail — thêm 1 lớp gửi song song, tái dùng toàn bộ phần gom dữ liệu đã có ở `reminder.service.js`:

```
services/
  zaloZns.service.js   # xin/refresh access token, gọi ZNS API gửi tin
```

Khác biệt kỹ thuật quan trọng so với Gmail/Graph API: **access token của Zalo hết hạn sau ~25 giờ**, phải dùng **refresh token** để lấy access token mới — và refresh token cũng có hạn dùng (đổi 1 lần thì token cũ mất hiệu lực). Cần lưu access token + refresh token vào DB (không chỉ giữ trong RAM như token Gmail/Graph), tự động refresh trước khi hết hạn, và có cơ chế cảnh báo nếu refresh thất bại liên tục (nghĩa là cần đăng nhập lại OA thủ công).

`reminder.service.js` sẽ gọi thêm `zaloZns.service.js` song song với `outlookMail.service.js` — cùng 1 danh sách "dự án cần nhắc theo người phụ trách" đã gom sẵn, chỉ khác lớp gửi.

### 5.1 Cấu trúc Template ZNS đã thiết kế — 1 dự án/tin, không gộp

Khác với mail (gộp nhiều dự án của cùng người phụ trách vào 1 mail), Template ZNS đã tạo dùng **3 tham số cố định theo từng dự án**: `<ten_du_an>`, `<so_qua_han>`, `<so_cham_tien_do>` — không phải 1 khối văn bản gộp nhiều dự án. Do đó:

- Nếu 1 người phụ trách có **nhiều dự án cần nhắc cùng lúc**, hệ thống phải **gửi nhiều tin ZNS riêng biệt** (1 tin/dự án), không gộp lại như mail được.
- Chi phí tính theo tin: người phụ trách N dự án có vấn đề = N tin × giá/tin (xem mục 4).
- Nội dung mẫu đã duyệt dạng:
  ```
  Nhắc cập nhật tiến độ dự án
  Dự án <ten_du_an> có:
  - <so_qua_han> hạng mục quá hạn
  - <so_cham_tien_do> hạng mục chậm tiến độ.
  Yêu cầu cập nhật tiến độ dự án <ten_du_an>
  [Nút] Xem chi tiết
  ```

Code `zaloZns.service.js`/`reminder.service.js` phần Zalo cần **lặp qua từng dự án** của mỗi người phụ trách và gọi API gửi ZNS riêng cho từng dự án, khác với vòng lặp gộp 1 lần đang dùng cho mail.

## 6. Việc cần làm (checklist)

1. [x] Zalo OA doanh nghiệp — đã có sẵn ("EVN GENCO2").
2. [x] Tạo App riêng trên Zalo Developers ("PMAN EVNGENCO2"), đã có `app_id`/`secret_key`. Lý do tạo App riêng thay vì dùng chung App cũ (đang phục vụ 1 website khác của admin): tránh 2 hệ thống giành nhau đổi `refresh_token` của cùng 1 App (mỗi lần refresh, Zalo huỷ refresh_token cũ) — App riêng không tốn thêm phí, vì phí ZNS tính theo OA chứ không theo App.
2b. [x] Liên kết App "PMAN EVNGENCO2" với OA "EVN GENCO2" — đã làm xong (mục "Liên kết với Official Account" trong trang App).
2c. [x] **ĐÃ TÌM RA NGUYÊN NHÂN KẸT** (mục "Danh sách OA đã cấp quyền" báo "Không tìm thấy kết quả phù hợp" dù tìm bằng tên hay OA ID `2275435227285145188`): theo tài liệu chính thức Zalo (oa.zalo.me/home/documents/guides), còn thiếu 1 mắt xích — **"ZBS Account" (Zalo Business Solutions, còn gọi ZCA — Zalo Cloud Account)**, dùng để quản lý chi phí dịch vụ OA (bao gồm ZNS). Quy trình đúng phải là: OA + App đều liên kết vào **cùng 1 ZBS Account**, thì bước "cấp quyền App cho OA" mới tìm thấy kết quả (1 ZBS Account có thể liên kết nhiều OA + nhiều App).
2d. [x] ZBS Account "EVNGENCO2" đã có sẵn (số dư 65.380đ, đã từng chi tiêu ZNS qua App "Nhắc lịch"). Đã liên kết thêm App "PMAN EVNGENCO2" vào ZBS Account này.
2e. [x] Sau khi liên kết ZBS, quay lại "Danh sách OA đã cấp quyền" trong trang App → tìm lại OA "EVN GENCO2" → ra kết quả, cấp quyền thành công (Tổng số: 1).
3. [x] Đã vào ZBS → Dịch vụ gửi tin → Quản lý Template → tạo Template mới, chọn App "PMAN EVNGENCO2" + OA "EVN GENCO2" — xác nhận ZNS dùng được cho App mới.
4. [x] Đã soạn nội dung Template: loại "Mẫu tuỳ chỉnh", mức "Cấp độ 1 - Giao dịch" (300đ/tin qua SĐT). Nội dung 3 tham số `ten_du_an` ("Tên khách hàng (30)"), `so_qua_han`/`so_cham_tien_do` ("Số lượng/Số tiền (20)"). **Lưu ý quan trọng đã phát hiện**: Template này cố định theo **1 dự án/tin**, không gộp nhiều dự án như mail được — xem chi tiết mục 5.1. Đã điền ghi chú cho kiểm duyệt, tick đồng ý điều khoản, **đã bấm gửi duyệt — đang chờ Zalo xét duyệt (thường vài ngày làm việc)**.
5. [ ] **TẠM DỪNG TẠI ĐÂY chờ kết quả duyệt Template.** Việc tiếp theo sau khi có kết quả: nếu duyệt — làm tiếp bước 6 (số điện thoại) và 7 (code `zaloZns.service.js`). Nếu bị từ chối — xem lý do Zalo phản hồi, sửa lại nội dung Template và gửi duyệt lại.
6. [ ] Thêm cột `users.so_dien_thoai`, kiểm tra SmartEVN API có trả sẵn số điện thoại không.
6. [ ] Thu thập số điện thoại cho các tài khoản chưa có (nhập tay hoặc chờ SmartEVN trả về).
7. [ ] Viết `services/zaloZns.service.js` — quản lý access/refresh token, gọi API gửi ZNS.
8. [ ] Tích hợp vào `reminder.service.js` — gửi song song 2 kênh (mail + Zalo), lỗi 1 kênh không ảnh hưởng kênh kia.
9. [ ] Test thật sau khi có template được duyệt.

## 8. Cách lấy access_token/refresh_token lần đầu (cần làm thủ công 1 lần)

Khác với Gmail (App Password dùng mãi) hay kiểu client-credentials, Zalo OA bắt buộc **1 lần cấp quyền qua trình duyệt** (OAuth) để sinh ra cặp token đầu tiên, sau đó code mới tự động refresh được.

1. Trong App trên Zalo Developers, vào mục cấu hình App → tìm **"Domain/URL callback"** (redirect URI) → thêm 1 URL bất kỳ bạn kiểm soát được (có thể tạm dùng `http://10.147.18.15:8098` — trang PMAN đang chạy — miễn là bạn xem được URL trình duyệt nhảy tới sau khi cấp quyền).
2. Mở trình duyệt, truy cập (thay `APP_ID` và `REDIRECT_URI` đúng của bạn):
   ```
   https://oauth.zaloapp.com/v4/oa/permission?app_id=APP_ID&redirect_uri=REDIRECT_URI
   ```
3. Đăng nhập bằng tài khoản Zalo đang quản trị OA "EVN GENCO2", bấm **Đồng ý cấp quyền**.
4. Trình duyệt sẽ nhảy sang `REDIRECT_URI?code=XXXXX&...` — copy giá trị `code` đó (chỉ dùng được 1 lần, còn hiệu lực trong thời gian ngắn).
5. Đổi `code` lấy access_token/refresh_token thật — gọi (không tự chạy qua tôi vì có `secret_key`, bạn tự chạy hoặc để tôi viết sẵn script rồi bạn tự điền `secret_key` khi chạy):
   ```
   POST https://oauth.zaloapp.com/v4/oa/access_token
   Header: secret_key: <SECRET_KEY>
   Body (x-www-form-urlencoded): app_id=<APP_ID>&code=<CODE_VUA_LAY>&grant_type=authorization_code
   ```
   Trả về `access_token` (hết hạn ~25h) và `refresh_token` (dùng để tự làm mới access_token về sau, không cần cấp quyền lại qua trình duyệt nữa — trừ khi refresh_token cũng hết hạn).
6. Lưu `refresh_token` này lại — code `zaloZns.service.js` sau này sẽ tự dùng nó để xin access_token mới mỗi khi hết hạn.

Báo tôi khi bạn có `code` (bước 4) hoặc đã có `access_token`/`refresh_token` (bước 5), tôi viết sẵn 1 script test gửi thử 1 tin ZNS mẫu.

## 7. Câu hỏi cần chốt trước khi bắt đầu

- Ai là người có quyền quản trị OA "EVN GENCO2" hiện tại (để tạo App trên Zalo Developers, xin duyệt template) — có phải chính bạn không, hay cần nhờ người khác?
- OA này đã từng dùng ZNS chưa, hay mới chỉ dùng cho Chat/Chatbot/Nội dung như trong ảnh?
- Có sẵn ngân sách cho chi phí gửi ZNS theo tin không, hay cần xin duyệt trước?
- Nội dung nhắc nhở qua Zalo có cần giống hệt nội dung mail không, hay rút gọn hơn (ZNS thường giới hạn độ dài/định dạng chặt hơn mail)?
