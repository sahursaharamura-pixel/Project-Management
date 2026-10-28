/* TẦNG SERVICE — suy ra cấp bậc phân quyền (3 mức) từ role + chức danh.

   Mô hình:
   - admin      : cột role='admin' (gán tay ở trang Quản lý người dùng) -> toàn quyền.
   - lanh_dao   : role='user' nhưng chức danh từ "Phó Trưởng Ban" trở lên -> chỉ xem
                  dashboard/báo cáo, KHÔNG được nhập liệu (thêm/sửa/xóa dự án, hạng mục...).
   - chuyen_vien: role='user', chức danh còn lại (hoặc chưa có chức danh) -> nhập liệu +
                  xem dashboard/báo cáo.

   Cấp bậc KHÔNG lưu cột riêng trong DB — suy ra từ chuc_danh mỗi lần cần, để tự động
   cập nhật khi chuc_danh đồng bộ lại từ SmartEVN (services/evnLogin.service.js). */

/* Từ khóa chức danh được coi là lãnh đạo (đối sánh không phân biệt hoa/thường, có dấu).
   "Từ Phó Trưởng Ban trở lên": Phó Trưởng Ban, Trưởng Ban, Phó/Giám đốc, Phó/Tổng Giám đốc,
   Chủ tịch... KHÔNG bao gồm Phó Trưởng phòng / Trưởng phòng (thấp hơn cấp Ban). */
const TU_KHOA_LANH_DAO = [
  'phó trưởng ban', 'trưởng ban',
  'phó giám đốc', 'giám đốc',
  'phó tổng giám đốc', 'tổng giám đốc',
  'chủ tịch',
];

const boDauTiengViet = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase();

const TU_KHOA_LANH_DAO_KHONG_DAU = TU_KHOA_LANH_DAO.map(boDauTiengViet);

function laChucDanhLanhDao(chucDanh) {
  if (!chucDanh) return false;
  const s = boDauTiengViet(chucDanh);
  return TU_KHOA_LANH_DAO_KHONG_DAU.some(tu => s.includes(tu));
}

/* Trả về 'admin' | 'lanh_dao' | 'chuyen_vien'. Nhận vào user record (cần role, chuc_danh). */
function xacDinhCapBac(user) {
  if (!user) return null;
  if (user.role === 'admin') return 'admin';
  return laChucDanhLanhDao(user.chuc_danh) ? 'lanh_dao' : 'chuyen_vien';
}

/* Cấp bậc được phép nhập liệu (thêm/sửa/xóa dữ liệu nghiệp vụ): admin + chuyên viên. */
const duocNhapLieu = (capBac) => capBac === 'admin' || capBac === 'chuyen_vien';

module.exports = { xacDinhCapBac, duocNhapLieu, laChucDanhLanhDao };
