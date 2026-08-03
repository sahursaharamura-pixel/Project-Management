# Các bước triển khai DB (email + người phụ trách dự án)

## 0. Đúng máy nào chạy lệnh nào — DB và Code nằm 2 server khác nhau

- **Server MySQL (10.147.0.36)**: chạy `mysqldump`/`mysql` ở bước 1, 2, 5 — vì `mysqldump.exe`/`mysql.exe` là công cụ đi kèm bản cài MySQL Server, chỉ có sẵn ở đây. Kết nối localhost (không cần `-h`, hoặc dùng `-h 127.0.0.1`).
- **Server IIS (10.147.18.15)**: chỉ deploy code đã sửa (bước 3) và restart app. **Không có MySQL client cài sẵn ở đây** (đúng như bạn gặp lỗi `'C:\Program' is not recognized`) — nên đừng chạy mysqldump ở máy này.

Tài khoản MySQL `pman_app` (app dùng để chạy) chỉ được phép kết nối từ IP `10.147.18.15` — xem `db/DEPLOY_REMOTE_MYSQL.txt`. Còn thao tác backup/migration bên dưới dùng tài khoản `root`, chạy ngay tại server MySQL nên không bị giới hạn IP này.

## 1. Backup trước khi đổi schema (bắt buộc) — chạy trên server MySQL (10.147.0.36)

Đăng nhập trực tiếp (RDP) vào server 10.147.0.36, mở CMD, tìm đúng đường dẫn cài đặt trước nếu chưa chắc:

```
where /r "C:\Program Files" mysqldump.exe
```

Rồi chạy (thay đường dẫn nếu `where` trả về khác), lưu file backup ngay tại server này trước, xong copy sang chỗ khác sau:

```
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p pman > D:\Backup\pman-backup-truoc-migration-002.sql
```

Nhập mật khẩu khi được hỏi (không gõ `-p<mật khẩu>` dính liền để tránh lộ mật khẩu trong lịch sử lệnh/Task Manager).

Kiểm tra file backup có dữ liệu thật (không rỗng, không lỗi):

```
findstr /C:"INSERT INTO `projects`" D:\Backup\pman-backup-truoc-migration-002.sql
```

Sau đó copy file này sang server IIS (vd. vào `D:\WebQuanLyDuAn-BanKHCNCDS\pman-clean\Backup\`) hoặc 1 nơi lưu trữ khác — không chỉ để 1 bản duy nhất trên server MySQL, phòng khi ổ đĩa server có sự cố.

## 2. Chạy migration 002 — chạy trên server MySQL (10.147.0.36)

File đã chuẩn bị sẵn: `db/migrations/002_add_email_and_manager.sql`. Copy file này từ code (hoặc từ server IIS) sang server MySQL trước, rồi chạy tại đây — an toàn chạy lại nhiều lần (tự kiểm tra cột đã tồn tại chưa trước khi thêm):

```
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p pman < 002_add_email_and_manager.sql
```

Kiểm tra đã thêm đúng cột:

```
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p pman -e "DESCRIBE users; DESCRIBE projects;"
```

Phải thấy `users.email` và `projects.manager_user_id`.

## 3. Deploy code đã sửa

Các file đã sửa trong repo (đẩy lên server IIS như bình thường):

- `db/schema.sql` — cập nhật để DB tạo mới từ đầu cũng có 2 cột này.
- `repositories/user.repo.js` — `insertEvn`/`syncEvnInfo` giờ lưu thêm `email`.
- `services/evnLogin.service.js` — trích `email` từ response SmartEVN.
- `repositories/project.repo.js`, `services/project.service.js` — `manager_user_id` tự gán bằng người tạo dự án lúc `tao()`, giữ nguyên lúc `capNhat()` (trừ khi form gửi field này).

Sau khi deploy, restart lại app (IIS recycle) để code mới có hiệu lực.

## 4. Kiểm tra email SmartEVN có về thật không (tự chạy, không qua ai khác)

Đăng nhập lại 1 tài khoản SmartEVN bất kỳ trên web PMAN (sau khi deploy code mới) — nếu API trả `email`, cột `users.email` của tài khoản đó sẽ tự có giá trị. Kiểm tra (chạy trên server MySQL, hoặc từ máy khác thêm `-h 10.147.0.36` nếu máy đó có quyền kết nối):

```
mysql -u root -p pman -e "SELECT username, email FROM users WHERE auth_source='evn';"
```

Nếu vẫn `NULL` sau khi đăng nhập lại — nghĩa là API SmartEVN thực tế **không trả** `email` cho tài khoản đó (dù docstring cũ ghi có), cần quay lại phương án nhập email thủ công.

### Cách khác: tự test trực tiếp API (không qua PMAN), nếu muốn xem nguyên response

Chạy lệnh sau **trên máy của bạn**, tự thay `TAI_KHOAN`/`MAT_KHAU` — không dán kết quả có mật khẩu vào đâu:

```
curl -s -X POST https://nghiquyet.evngenco2.vn/api/v1/auth/login ^
  -H "X-Api-Key: <EVN_API_KEY_lay_trong_config.js>" ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"TAI_KHOAN\",\"password\":\"MAT_KHAU\"}"
```

Xem trong JSON trả về có field `email` trong object `user` không.

## 5. Gán người phụ trách cho 3 dự án đang có (dữ liệu cũ) — chạy trên server MySQL

3 dự án hiện có được tạo trước khi có tính năng này nên `manager_user_id` sẽ là `NULL`. Gán tay 1 lần:

```
mysql -u root -p pman -e "SELECT id, name FROM projects WHERE archived=0;"
mysql -u root -p pman -e "SELECT id, username, name FROM users;"
-- Sau khi biết đúng id, gán:
mysql -u root -p pman -e "UPDATE projects SET manager_user_id = <id_user> WHERE id = <id_project>;"
```

(Về sau nên làm thêm ô "Người phụ trách" sửa được trong form sửa dự án, thay vì phải chạy SQL tay mỗi lần — chưa nằm trong phạm vi đợt này.)
