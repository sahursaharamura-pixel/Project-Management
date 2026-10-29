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
const fileService    = require('../services/tinhHinhFile.service');
const siteService    = require('../services/site.service');
const contentDisposition = require('content-disposition');
const { requireAuth, requireAdmin, requireNhapLieu } = require('../middleware/auth');
const ah = require('../middleware/asyncHandler');
const config = require('../config');

const id = req => parseInt(req.params.id);

module.exports = () => {

  /* ── DASHBOARD ── */
  router.get('/stats', ah(async (req, res) => {
    res.json(await statsService.tongHop(req.session?.user));
  }));

  /* ── DỰ ÁN ──
     Danh sách/chi tiết dự án chỉ dành cho người đã đăng nhập; khách vãng lai
     chỉ được xem /stats (dashboard tổng quan), không xem được chi tiết dự án. */
  router.get('/projects', requireAuth, ah(async (req, res) => {
    res.json(await projectService.danhSach(req.session.user));
  }));

  router.post('/projects', requireNhapLieu, ah(async (req, res) => {
    res.json({ id: await projectService.tao(req.session.user, req.body) });
  }));

  router.put('/projects/:id', requireNhapLieu, ah(async (req, res) => {
    await projectService.capNhat(req.session.user, id(req), req.body);
    res.json({ ok: true });
  }));

  router.delete('/projects/:id', requireNhapLieu, ah(async (req, res) => {
    await projectService.xoa(req.session.user, id(req));
    res.json({ ok: true });
  }));

  router.get('/projects/:id/detail', requireAuth, ah(async (req, res) => {
    res.json(await projectService.chiTiet(req.session.user, id(req)));
  }));

  /* ── LƯU TRỮ / KHÔI PHỤC DỰ ÁN ── */
  router.post('/projects/:id/archive', requireNhapLieu, ah(async (req, res) => {
    const archiveId = await projectService.luuTru(req.session.user, id(req), req.body.note);
    res.json({ ok: true, archive_id: archiveId });
  }));

  router.post('/projects/:id/unarchive', requireNhapLieu, ah(async (req, res) => {
    await projectService.khoiPhuc(req.session.user, id(req));
    res.json({ ok: true });
  }));

  /* ── HẠNG MỤC ── */
  router.get('/items', requireAuth, ah(async (req, res) => {
    res.json(await itemService.danhSach(siteService.siteCua(req.session.user), req.query));
  }));

  router.post('/items', requireNhapLieu, ah(async (req, res) => {
    res.json({ id: await itemService.tao(req.session.user, req.body) });
  }));

  router.put('/items/:id', requireNhapLieu, ah(async (req, res) => {
    await itemService.capNhat(req.session.user, id(req), req.body);
    res.json({ ok: true });
  }));

  router.delete('/items/:id', requireNhapLieu, ah(async (req, res) => {
    await itemService.xoa(req.session.user, id(req));
    res.json({ ok: true });
  }));

  /* ── TÌNH HÌNH TRIỂN KHAI ── */
  router.get('/items/:id/tinh-hinh', requireAuth, ah(async (req, res) => {
    res.json(await itemService.danhSachTinhHinh(req.session.user, id(req)));
  }));

  router.post('/items/:id/tinh-hinh', requireNhapLieu, ah(async (req, res) => {
    const newId = await itemService.themTinhHinh(req.session.user, id(req), req.body.noi_dung);
    res.json({ id: newId });
  }));

  router.delete('/tinh-hinh/:id', requireNhapLieu, ah(async (req, res) => {
    await itemService.xoaTinhHinh(req.session.user, id(req));
    res.json({ ok: true });
  }));

  /* ── VĂN BẢN ĐÍNH KÈM TÌNH HÌNH (PDF, Word) ──
     Mỗi request gửi 1 file dạng nhị phân thô (body = nội dung file),
     tên gốc nằm ở header X-File-Name (đã encodeURIComponent). */
  router.post('/tinh-hinh/:id/files', requireNhapLieu,
    express.raw({ type: () => true, limit: fileService.DUNG_LUONG_TOI_DA }),
    ah(async (req, res) => {
      const tenGoc = decodeURIComponent(req.headers['x-file-name'] || '');
      res.json({ id: await fileService.tai(req.session.user, id(req), tenGoc, req.body) });
    }));

  /* PDF mở xem ngay trên trình duyệt, Word thì tải về */
  router.get('/tinh-hinh-files/:id', requireAuth, ah(async (req, res) => {
    const f = await fileService.layFileCuaNguoiDung(req.session.user, id(req));
    res.setHeader('Content-Type', f.mime);
    res.setHeader('Content-Disposition', contentDisposition(f.ten_goc, {
      type: f.mime === 'application/pdf' ? 'inline' : 'attachment',
    }));
    res.sendFile(f.duongDan);
  }));

  router.delete('/tinh-hinh-files/:id', requireNhapLieu, ah(async (req, res) => {
    await fileService.xoa(req.session.user, id(req));
    res.json({ ok: true });
  }));

  /* ── BẢN LƯU TRỮ ── */
  router.get('/archives', requireAuth, ah(async (req, res) => {
    res.json(await archiveService.danhSach(req.session.user));
  }));

  router.get('/archives/:id/export', requireAuth, ah(async (req, res) => {
    const { banLuuTru, tenFile } = await archiveService.xuatFile(req.session.user, id(req));
    res.setHeader('Content-Disposition', `attachment; filename="${tenFile}"`);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(JSON.stringify(banLuuTru, null, 2));
  }));

  /* ── RESET TOÀN BỘ DỮ LIỆU CỦA SITE ĐANG LÀM VIỆC (chỉ admin) ── */
  router.post('/reset', requireAdmin, ah(async (req, res) => {
    await adminService.resetToanBoDuLieu(req.session.user);
    res.json({ ok: true });
  }));

  /* ── DỮ LIỆU TRANG ĐỊNH HƯỚNG KHCN / KH SXKD ──
     Lưu ở file JSON riêng (data/khcn-data.json, data/sxkd-data.json), không dùng MySQL —
     2 trang này phục vụ riêng nhu cầu Ban KHCN&CĐS, không áp dụng chung toàn hệ thống. */
  router.get('/khcn-data', ah(async (req, res) => {
    res.json(await khcnSxkdService.getKhcn(req.session?.user));
  }));

  router.put('/khcn-data', requireNhapLieu, ah(async (req, res) => {
    await khcnSxkdService.saveKhcn(req.session.user, req.body);
    res.json({ ok: true });
  }));

  router.get('/sxkd-data', ah(async (req, res) => {
    res.json(await khcnSxkdService.getSxkd(req.session?.user));
  }));

  router.put('/sxkd-data', requireNhapLieu, ah(async (req, res) => {
    await khcnSxkdService.saveSxkd(req.session.user, req.body);
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
