/* TẦNG ROUTE — chỉ điều phối HTTP. Không SQL, không nghiệp vụ. */
const express = require('express');
const router  = express.Router();

const projectService = require('../services/project.service');
const itemService    = require('../services/item.service');
const statsService   = require('../services/stats.service');
const archiveService = require('../services/archive.service');
const adminService   = require('../services/admin.service');
const khcnSxkdService = require('../services/khcnSxkd.service');
const reminderService = require('../services/reminder.service');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const ah = require('../middleware/asyncHandler');
const config = require('../config');

const id = req => parseInt(req.params.id);

module.exports = () => {

  /* ── DASHBOARD ── */
  router.get('/stats', ah(async (req, res) => {
    res.json(await statsService.tongHop());
  }));

  /* ── DỰ ÁN ── */
  router.get('/projects', ah(async (req, res) => {
    res.json(await projectService.danhSach());
  }));

  router.post('/projects', requireAuth, ah(async (req, res) => {
    res.json({ id: await projectService.tao(req.session.user, req.body) });
  }));

  router.put('/projects/:id', requireAuth, ah(async (req, res) => {
    await projectService.capNhat(req.session.user, id(req), req.body);
    res.json({ ok: true });
  }));

  router.delete('/projects/:id', requireAuth, ah(async (req, res) => {
    await projectService.xoa(req.session.user, id(req));
    res.json({ ok: true });
  }));

  router.get('/projects/:id/detail', ah(async (req, res) => {
    res.json(await projectService.chiTiet(id(req)));
  }));

  /* ── LƯU TRỮ / KHÔI PHỤC DỰ ÁN ── */
  router.post('/projects/:id/archive', requireAuth, ah(async (req, res) => {
    const archiveId = await projectService.luuTru(req.session.user, id(req), req.body.note);
    res.json({ ok: true, archive_id: archiveId });
  }));

  router.post('/projects/:id/unarchive', requireAuth, ah(async (req, res) => {
    await projectService.khoiPhuc(req.session.user, id(req));
    res.json({ ok: true });
  }));

  /* ── HẠNG MỤC ── */
  router.get('/items', ah(async (req, res) => {
    res.json(await itemService.danhSach(req.query));
  }));

  router.post('/items', requireAuth, ah(async (req, res) => {
    res.json({ id: await itemService.tao(req.session.user, req.body) });
  }));

  router.put('/items/:id', requireAuth, ah(async (req, res) => {
    await itemService.capNhat(req.session.user, id(req), req.body);
    res.json({ ok: true });
  }));

  router.delete('/items/:id', requireAuth, ah(async (req, res) => {
    await itemService.xoa(req.session.user, id(req));
    res.json({ ok: true });
  }));

  /* ── TÌNH HÌNH TRIỂN KHAI ── */
  router.get('/items/:id/tinh-hinh', ah(async (req, res) => {
    res.json(await itemService.danhSachTinhHinh(id(req)));
  }));

  router.post('/items/:id/tinh-hinh', requireAuth, ah(async (req, res) => {
    const newId = await itemService.themTinhHinh(req.session.user, id(req), req.body.noi_dung);
    res.json({ id: newId });
  }));

  router.delete('/tinh-hinh/:id', requireAuth, ah(async (req, res) => {
    await itemService.xoaTinhHinh(req.session.user, id(req));
    res.json({ ok: true });
  }));

  /* ── BẢN LƯU TRỮ ── */
  router.get('/archives', ah(async (req, res) => {
    res.json(await archiveService.danhSach());
  }));

  router.get('/archives/:id/export', ah(async (req, res) => {
    const { banLuuTru, tenFile } = await archiveService.xuatFile(id(req));
    res.setHeader('Content-Disposition', `attachment; filename="${tenFile}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(banLuuTru, null, 2));
  }));

  /* ── RESET TOÀN BỘ DỮ LIỆU (chỉ admin) ── */
  router.post('/reset', requireAdmin, ah(async (req, res) => {
    await adminService.resetToanBoDuLieu(req.session.user);
    res.json({ ok: true });
  }));

  /* ── DỮ LIỆU TRANG ĐỊNH HƯỚNG KHCN / KH SXKD ──
     Lưu ở file JSON riêng (data/khcn-data.json, data/sxkd-data.json), không dùng MySQL —
     2 trang này phục vụ riêng nhu cầu Ban KHCN&CĐS, không áp dụng chung toàn hệ thống. */
  router.get('/khcn-data', ah(async (req, res) => {
    res.json(await khcnSxkdService.getKhcn());
  }));

  router.put('/khcn-data', requireAuth, ah(async (req, res) => {
    await khcnSxkdService.saveKhcn(req.body);
    res.json({ ok: true });
  }));

  router.get('/sxkd-data', ah(async (req, res) => {
    res.json(await khcnSxkdService.getSxkd());
  }));

  router.put('/sxkd-data', requireAuth, ah(async (req, res) => {
    await khcnSxkdService.saveSxkd(req.body);
    res.json({ ok: true });
  }));

  /* ── NHẮC NHỞ QUA MAIL ──
     2 cách kích hoạt:
     - /admin/reminders/run-now : admin bấm tay trên web để test ngay.
     - /internal/reminders/run  : không qua đăng nhập, dùng cho Windows Task
       Scheduler gọi đúng lịch (xem huong-phat-trien/gui-mail-nhac-nho.md mục 5),
       xác thực bằng khoá bí mật trong header thay vì session. */
  router.post('/admin/reminders/run-now', requireAdmin, ah(async (req, res) => {
    res.json({ ketQua: await reminderService.guiNhacNhoDinhKy() });
  }));

  router.post('/internal/reminders/run', ah(async (req, res) => {
    if (req.headers['x-internal-key'] !== config.INTERNAL_REMINDER_KEY) {
      return res.status(401).json({ error: 'Không có quyền' });
    }
    res.json({ ketQua: await reminderService.guiNhacNhoDinhKy() });
  }));

  return router;
};
