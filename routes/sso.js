/* TẦNG ROUTE — đăng nhập một lần (SSO) qua myapps.evngenco2.vn.
   Thẻ phần mềm trên myapps trỏ vào /auth/sso. Mở thẳng phần mềm thì vẫn hiện form
   đăng nhập cũ, không tự chuyển sang myapps.

   Mọi lỗi đều quay về trang chủ kèm ?sso=... (auth.js hiện câu giải thích trên form
   đăng nhập), không ra trang 500:
     error    = không kết nối được myapps, mã hết hạn...
     evnloi   = SmartEVN gián đoạn, không lấy được hồ sơ -> đăng nhập tại địa chỉ riêng
     denied   = người dùng huỷ ở myapps
     noaccess = tài khoản chưa được cấp quyền vào phần mềm */
const express = require('express');
const router  = express.Router();

const sso         = require('../services/sso.service');
const authService = require('../services/auth.service');
const layIpClient = require('../utils/layIpClient');

/* Chỉ nhận đường dẫn nội bộ, chống chuyển hướng sang site lạ (//site-la,
   /\site-la, hoặc xen ký tự điều khiển mà trình duyệt sẽ tự bỏ đi). */
const NOI_BO = /^\/(?!\/)[^\\\x00-\x1f]*$/;
const dichNoiBo = (url) => (typeof url === 'string' && NOI_BO.test(url) ? url : '/');

/* Ghi xong session rồi mới chuyển trang, để request kế tiếp chắc chắn đọc được. */
function luuRoiChuyen(req, res, url) {
  req.session.save(() => res.redirect(url));
}

/* Trang dẫn tới request này, chỉ lấy địa chỉ, bỏ tham số để không ghi code/state vào log. */
function nguonVao(req) {
  try {
    const u = new URL(req.get('referer'));
    return u.origin + u.pathname;
  } catch {
    return '(không có)';
  }
}

module.exports = () => {

  /* ── TRANG CHỦ (chỉ ghi log) ──
     Thẻ myapps trỏ nhầm về đây thì người dùng chỉ thấy form đăng nhập, không có lỗi
     gì; dòng log này cho biết điều đó. Gắn trước express.static, nếu không static
     đã trả index.html và request không tới được đây. */
  router.get('/', (req, res, next) => {
    if (sso.daBat() && !req.session.user) {
      sso.ghiLog(`Mở trang chủ khi chưa đăng nhập (không đi qua /auth/sso) | sso=${req.query.sso || ''} | từ: ${nguonVao(req)}`);
    }
    next();
  });

  /* ── LỐI VÀO SSO ── */
  router.get('/auth/sso', async (req, res) => {
    const dich = dichNoiBo(req.query.returnUrl);
    if (req.session.user) {
      sso.ghiLog(`/auth/sso: đã có phiên của ${req.session.user.username}, vào thẳng ${dich} | từ: ${nguonVao(req)}`);
      return res.redirect(dich);
    }
    if (!sso.daBat()) {
      sso.ghiLog('/auth/sso: SSO đang tắt (OIDC_ISSUER trống), về form đăng nhập');
      return res.redirect('/');
    }
    try {
      const { url, oidc } = await sso.taoYeuCauDangNhap();
      req.session.oidc = { ...oidc, dich };
      sso.ghiLog(`/auth/sso: chuyển sang myapps | từ: ${nguonVao(req)}`);
      luuRoiChuyen(req, res, url);
    } catch (e) {
      sso.ghiLog(`LỖI /auth/sso: không tải được cấu hình myapps: ${e.message}`);
      res.redirect('/?sso=error');
    }
  });

  /* ── NHẬN KẾT QUẢ TỪ MYAPPS ── */
  router.get('/signin-oidc', async (req, res) => {
    const oidc = req.session.oidc;
    delete req.session.oidc;
    if (req.query.error) {
      sso.ghiLog(`LỖI /signin-oidc: myapps trả lỗi ${req.query.error}: ${req.query.error_description || ''}`);
      return luuRoiChuyen(req, res, '/?sso=' + (req.query.error === 'access_denied' ? 'denied' : 'error'));
    }
    if (!sso.daBat() || !oidc) {
      sso.ghiLog(`LỖI /signin-oidc: ${sso.daBat() ? 'không có phiên chờ đăng nhập (mất cookie, hết phiên hoặc mở lại địa chỉ cũ)' : 'SSO đang tắt'}`);
      return luuRoiChuyen(req, res, '/?sso=error');
    }
    let username;
    try {
      username = await sso.nhanKetQua(req, oidc);
      const { phien } = await authService.dangNhapSso({ username, ip: layIpClient(req) });
      req.session.user = phien;
      sso.ghiLog(`/signin-oidc: đăng nhập thành công: ${username}, vào ${oidc.dich || '/'}`);
      luuRoiChuyen(req, res, oidc.dich || '/');
    } catch (e) {
      const ma = e.status === 403 ? 'noaccess' : e.status === 503 ? 'evnloi' : 'error';
      sso.ghiLog(`LỖI /signin-oidc (${ma}) | tên đăng nhập: ${username || '(chưa có)'} | ${e.message}`);
      luuRoiChuyen(req, res, '/?sso=' + ma);
    }
  });

  /* ── SAU ĐĂNG XUẤT (đăng ký sẵn cho myapps) ──
     Đăng xuất phần mềm vẫn dùng POST /api/logout: chỉ thoát phần mềm, không
     đăng xuất myapps để các phần mềm khác trên myapps vẫn còn đăng nhập. */
  router.get('/signout-callback-oidc', (req, res) => res.redirect('/'));

  return router;
};
