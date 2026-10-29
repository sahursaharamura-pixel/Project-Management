/* Xử lý phần đăng nhập bằng tài khoản SmartEVN cho tầng auth.service.
   Bản này bám kiến trúc GĐ2: thao tác DB qua user.repo, không viết SQL trực tiếp.

   Quy ước:
   - User EVN mới     -> role = 'user' (admin nâng quyền admin sau nếu cần).
     Cấp bậc lãnh đạo/chuyên viên KHÔNG set ở đây — được suy ra tự động từ
     chuc_danh mỗi lần dùng (xem services/permission.service.js).
   - Định danh ổn định -> ma_nhan_vien (KHÔNG dùng username làm khóa).
   - Không mật khẩu local -> auth_source = 'evn', password_hash = NULL. */
const userRepo = require('../repositories/user.repo');

const VAI_TRO_MAC_DINH = 'user';

/* Dịch reason từ API EVN -> thông báo tiếng Việt. */
const THONG_BAO_LOI = {
  invalid_credentials: 'Tên đăng nhập hoặc mật khẩu không đúng',
  locked:              'Tài khoản EVN của bạn đang bị khóa',
  missing_credentials: 'Thiếu tên đăng nhập hoặc mật khẩu',
  upstream_error:      'Hệ thống SmartEVN đang gián đoạn, vui lòng thử lại sau',
  not_configured:      'Máy chủ chưa cấu hình kết nối SmartEVN',
  timeout:             'Kết nối tới SmartEVN quá thời gian chờ, vui lòng thử lại',
  network_error:       'Không kết nối được tới SmartEVN, vui lòng thử lại sau',
  bad_response:        'SmartEVN trả về dữ liệu không hợp lệ',
};

const dichLoi = (reason) => THONG_BAO_LOI[reason] || 'Đăng nhập qua SmartEVN thất bại';

/* Reason thuộc lỗi hạ tầng (để route trả 503 thay vì 401). */
const LOI_HA_TANG = ['timeout', 'network_error', 'upstream_error', 'not_configured', 'bad_response'];
const laLoiHaTang = (reason) => LOI_HA_TANG.includes(reason);

/* Từ dữ liệu user API EVN -> tạo mới (JIT) hoặc đồng bộ -> trả về record DB. */
async function taoHoacDongBo(evnUser) {
  const username   = String(evnUser.username || '').trim();
  const name       = evnUser.hoTen || username;
  const maNhanVien = evnUser.maNhanVien || null;
  const chucDanh   = evnUser.chucDanh || null;
  const phongBan   = evnUser.phongBan?.ten || null;
  const email      = evnUser.email || null;
  /* "Đơn vị": SmartEVN hiện chỉ trả { donVi: { id } }, không kèm tên.
     don_vi_id quyết định site người dùng được vào (services/site.service.js).
     Tên đơn vị giữ lại nếu sau này API có trả; chỉ nhận chuỗi, không ghi object. */
  const donViId    = parseInt(evnUser.donVi?.id, 10) || null;
  const tenDonVi   = evnUser.donVi?.ten || evnUser.tenDonVi;
  const donVi      = typeof tenDonVi === 'string' && tenDonVi.trim() ? tenDonVi.trim() : null;

  /* Ưu tiên đối chiếu theo mã NV; không có mã thì lùi về username. */
  let user = maNhanVien
    ? await userRepo.findByMaNhanVien(maNhanVien)
    : await userRepo.findByUsername(username);

  if (!user) {
    const id = await userRepo.insertEvn({
      username, name, role: VAI_TRO_MAC_DINH,
      ma_nhan_vien: maNhanVien, chuc_danh: chucDanh, phong_ban: phongBan, don_vi: donVi, don_vi_id: donViId, email,
    });
    user = await userRepo.findById(id);
  } else {
    await userRepo.syncEvnInfo(user.id, { username, name, chuc_danh: chucDanh, phong_ban: phongBan, don_vi: donVi, don_vi_id: donViId, email });
    user.username = username; user.name = name;
    user.chuc_danh = chucDanh; user.don_vi_id = donViId;
  }

  return user;
}

module.exports = { taoHoacDongBo, dichLoi, laLoiHaTang, VAI_TRO_MAC_DINH };
