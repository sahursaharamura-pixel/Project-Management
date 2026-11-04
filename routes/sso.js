/* TẦNG ROUTE — đăng nhập một lần (SSO) qua myapps.evngenco2.vn.
   Mở phần mềm khi chưa có phiên (kể cả bấm thẻ myapps, vốn trỏ về trang chủ): tự kiểm
   tra ngầm trên myapps. Đang đăng nhập myapps thì vào thẳng; chưa thì hiện form đăng
   nhập của phần mềm, người dùng không thấy màn hình nào của myapps.
   /auth/sso vẫn là lối vào đầy đủ: chưa đăng nhập myapps thì myapps hỏi đăng nhập.

   Có ?sso=... thì không kiểm tra ngầm, chỉ hiện form (auth.js đọc tham số này và hiện
   câu giải thích nếu có), nhờ đó không bị lặp chuyển trang và không ra trang 500:
     guest    = chưa đăng nhập myapps, không báo gì
     form     = cố ý mở form (đăng xuất xong, hoặc tài khoản nội bộ gõ thẳng /?sso=form)
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

  /* ── MỞ PHẦN MỀM KHI CHƯA CÓ PHIÊN: KIỂM TRA NGẦM TRÊN MYAPPS ──
     Gắn trước express.static, nếu không static đã trả index.html và request không
     tới được đây. /du-an/:id là link trong mail nhắc nhở, giữ đúng trang sau đăng nhập. */
  router.get(['/', '/du-an/:id'], async (req, res, next) => {
    if (req.session.user || !sso.daBat() || req.query.sso) return next();
    if (!await sso.myappsConSong()) {
      sso.ghiLog('Kiểm tra ngầm: myapps không phản hồi, hiện form đăng nhập');
      return next();
    }
    try {
      const { url, oidc } = await sso.taoYeuCauDangNhap({ imLang: true });
      req.session.oidc = { ...oidc, dich: dichNoiBo(req.originalUrl), imLang: true };
      sso.ghiLog(`Kiểm tra ngầm phiên myapps | ${req.originalUrl}`);
      luuRoiChuyen(req, res, url);
    } catch (e) {
      sso.ghiLog(`LỖI kiểm tra ngầm: ${e.message}`);
      next();
    }
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
    if (req.query.error && oidc?.imLang) {
      sso.ghiLog(`Kiểm tra ngầm: chưa vào được qua myapps (${req.query.error}), hiện form đăng nhập`);
      const dich = oidc.dich || '/';
      return luuRoiChuyen(req, res, dich + (dich.includes('?') ? '&' : '?') + 'sso=guest');
    }
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
