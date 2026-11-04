/* TẦNG ROUTE — đăng nhập một lần (SSO) qua myapps.evngenco2.vn.
   Thẻ phần mềm trên myapps trỏ vào /auth/sso. Mở thẳng phần mềm thì vẫn hiện form
   đăng nhập cũ, không tự chuyển sang myapps.

   Mọi lỗi đều quay về trang chủ kèm ?sso=... (auth.js hiện câu giải thích trên form
   đăng nhập), không ra trang 500:
     error    = không kết nối được myapps/SmartEVN, mã hết hạn...
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

module.exports = () => {

  /* ── LỐI VÀO SSO ── */
  router.get('/auth/sso', async (req, res) => {
    const dich = dichNoiBo(req.query.returnUrl);
    if (req.session.user) return res.redirect(dich);
    if (!sso.daBat()) return res.redirect('/');
    try {
      const { url, oidc } = await sso.taoYeuCauDangNhap();
      req.session.oidc = { ...oidc, dich };
      luuRoiChuyen(req, res, url);
    } catch (e) {
      console.error('❌ SSO: không tải được cấu hình myapps:', e.message);
      res.redirect('/?sso=error');
    }
  });

  /* ── NHẬN KẾT QUẢ TỪ MYAPPS ── */
  router.get('/signin-oidc', async (req, res) => {
    const oidc = req.session.oidc;
    delete req.session.oidc;
    if (req.query.error) {
      return luuRoiChuyen(req, res, '/?sso=' + (req.query.error === 'access_denied' ? 'denied' : 'error'));
    }
    if (!sso.daBat() || !oidc) return luuRoiChuyen(req, res, '/?sso=error');
    try {
      const username = await sso.nhanKetQua(req, oidc);
      const { phien } = await authService.dangNhapSso({ username, ip: layIpClient(req) });
      req.session.user = phien;
      luuRoiChuyen(req, res, oidc.dich || '/');
    } catch (e) {
      if (e.status !== 403) console.error('❌ SSO: đăng nhập thất bại:', e.message);
      luuRoiChuyen(req, res, e.status === 403 ? '/?sso=noaccess' : '/?sso=error');
    }
  });

  /* ── SAU ĐĂNG XUẤT (đăng ký sẵn cho myapps) ──
     Đăng xuất phần mềm vẫn dùng POST /api/logout: chỉ thoát phần mềm, không
     đăng xuất myapps để các phần mềm khác trên myapps vẫn còn đăng nhập. */
  router.get('/signout-callback-oidc', (req, res) => res.redirect('/'));

  return router;
};
