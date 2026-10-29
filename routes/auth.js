/* TẦNG ROUTE — chỉ làm 3 việc: lấy dữ liệu từ req, gọi service, trả res.json.
   Không SQL, không nghiệp vụ. Lỗi service throw ra được asyncHandler đẩy về
   middleware xử lý lỗi ở server.js. */
const express = require('express');
const router  = express.Router();

const authService = require('../services/auth.service');
const audit       = require('../services/audit.service');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const ah = require('../middleware/asyncHandler');

/* Lấy IP thật của client, ưu tiên X-Forwarded-For (khi qua IIS/reverse proxy),
   bỏ tiền tố ::ffff: của địa chỉ IPv4-mapped-IPv6 cho gọn. */
function layIpClient(req) {
  const xff = req.headers['x-forwarded-for'];
  let ip = (xff ? xff.split(',')[0].trim() : null) || req.ip || req.socket?.remoteAddress || '';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip || 'Không xác định';
}

module.exports = () => {

  /* ── IP CỦA CLIENT (hiển thị ở khung đăng nhập) ── */
  router.get('/client-ip', (req, res) => {
    res.json({ ip: layIpClient(req) });
  });

  /* ── ĐĂNG NHẬP ── */
  router.post('/login', ah(async (req, res) => {
    const { phien, ketQua } = await authService.dangNhap({ ...req.body, ip: layIpClient(req) });
    req.session.user = phien;
    res.json(ketQua);
  }));

  /* ── ĐĂNG XUẤT ── */
  router.post('/logout', ah(async (req, res) => {
    if (req.session.user) {
      await audit.ghiNhatKy({
        user:        req.session.user,
        action:      'logout',
        entity:      'user',
        entity_id:   req.session.user.id,
        entity_name: req.session.user.name,
      });
    }
    req.session.destroy(() => res.json({ ok: true }));
  }));

  /* ── NGƯỜI DÙNG HIỆN TẠI (gọn, lấy từ session) ── */
  router.get('/me', (req, res) => {
    res.json(authService.nguoiDungHienTai(req.session?.user));
  });

  /* ── SITE ĐANG LÀM VIỆC (cả khách chưa đăng nhập, để hiện đúng tên đơn vị) ── */
  router.get('/site', (req, res) => {
    res.json(authService.thongTinSite(req.session?.user));
  });

  /* ── ADMIN CHUYỂN SITE (Ban KHCN&CĐS <-> Thác Mơ) ── */
  router.post('/me/site', requireAdmin, (req, res) => {
    req.session.user = authService.chuyenSite(req.session.user, req.body?.site);
    res.json(authService.nguoiDungHienTai(req.session.user));
  });

  /* ── HỒ SƠ NGƯỜI DÙNG HIỆN TẠI (đầy đủ, đọc mới từ DB) ──
     Trả về thêm chức vụ, phòng ban, đơn vị, quyền hạn... để hiển thị
     trang hồ sơ. Đọc lại từ DB nên luôn phản ánh thông tin mới nhất. */
  router.get('/me/profile', requireAuth, ah(async (req, res) => {
    res.json(await authService.layHoSo(req.session.user));
  }));

  /* ── ĐỔI MẬT KHẨU CỦA CHÍNH MÌNH ── */
  router.post('/me/password', requireAuth, ah(async (req, res) => {
    await authService.doiMatKhau(req.session.user, req.body);
    res.json({ ok: true });
  }));

  /* ── QUẢN LÝ NGƯỜI DÙNG (chỉ admin) ── */
  router.get('/users', requireAdmin, ah(async (req, res) => {
    res.json(await authService.danhSachNguoiDung());
  }));

  router.post('/users', requireAdmin, ah(async (req, res) => {
    const id = await authService.taoNguoiDung(req.session.user, req.body);
    res.json({ id });
  }));

  router.put('/users/:id', requireAdmin, ah(async (req, res) => {
    await authService.capNhatNguoiDung(req.session.user, parseInt(req.params.id), req.body);
    res.json({ ok: true });
  }));

  router.delete('/users/:id', requireAdmin, ah(async (req, res) => {
    await authService.xoaNguoiDung(req.session.user, parseInt(req.params.id));
    res.json({ ok: true });
  }));

  /* ── LỊCH SỬ THAY ĐỔI (chỉ admin) ── */
  router.get('/audit-log', requireAdmin, ah(async (req, res) => {
    res.json(await audit.layNhatKyGanDay());
  }));

  return router;
};
