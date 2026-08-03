/* TẦNG SERVICE — gom dữ liệu dự án theo người phụ trách, tính chỉ số cần
   nhắc, gọi outlookMail để gửi. Lỗi gửi cho 1 người không được làm dừng
   cả batch — mỗi người thất bại độc lập, vẫn tiếp tục gửi cho người còn lại. */
const projectRepo  = require('../repositories/project.repo');
const itemService   = require('../services/item.service');
const userRepo      = require('../repositories/user.repo');
const rules         = require('./status.rules');
const outlookMail   = require('./outlookMail.service');
const audit         = require('./audit.service');
const config        = require('../config');

/* Gom dự án cần nhắc theo người phụ trách.
   Bỏ qua: dự án chưa có manager_user_id, hoặc dự án không có vấn đề gì. */
async function gomDuAnCanNhac() {
  const [projects, items] = await Promise.all([
    projectRepo.findAllActive(),
    itemService.danhSach({}),   // đã tự đồng bộ status theo ngày tháng trước khi đếm
  ]);

  const theoNguoiPhuTrach = new Map();
  for (const p of projects) {
    if (!p.manager_user_id) continue;

    const hangMuc    = items.filter(i => i.project_id === p.id);
    const quaHan      = rules.demQuaHan(hangMuc);
    const chamTienDo  = rules.demChamTienDo(hangMuc);
    if (quaHan === 0 && chamTienDo === 0) continue;

    const list = theoNguoiPhuTrach.get(p.manager_user_id) || [];
    list.push({ project: p, quaHan, chamTienDo });
    theoNguoiPhuTrach.set(p.manager_user_id, list);
  }
  return theoNguoiPhuTrach;
}

function taoNoiDungMail(danhSachDuAn) {
  const phan = danhSachDuAn.map(({ project, quaHan, chamTienDo }) => `
    <p style="margin:0 0 12px">
      <b>${escapeHtml(project.name)}</b><br>
      ${quaHan     ? `${quaHan} hạng mục quá hạn<br>`     : ''}
      ${chamTienDo ? `${chamTienDo} hạng mục chậm tiến độ<br>` : ''}
    </p>`).join('');

  const link = config.PMAN_BASE_URL
    ? `<p><a href="${config.PMAN_BASE_URL}">Xem chi tiết trên PMAN</a></p>`
    : '';

  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">${phan}${link}</div>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* Chạy toàn bộ luồng: gom dữ liệu -> gửi mail từng người -> ghi log. */
async function guiNhacNhoDinhKy() {
  const theoNguoiPhuTrach = await gomDuAnCanNhac();

  const ketQua = [];
  for (const [managerId, danhSachDuAn] of theoNguoiPhuTrach) {
    const nguoi = await userRepo.findById(managerId);
    if (!nguoi?.email) {
      ketQua.push({ managerId, name: nguoi?.name || `#${managerId}`, ok: false, ly_do: 'Chưa có email' });
      continue;
    }
    try {
      await outlookMail.guiMail({
        toList:   [nguoi.email],
        ccList:   (config.MAIL_CC_LUON_LUON || []).filter(cc => cc !== nguoi.email),
        subject:  `[PMAN] Nhắc việc dự án — ${new Date().toLocaleDateString('vi-VN')}`,
        bodyHtml: taoNoiDungMail(danhSachDuAn),
      });
      ketQua.push({ managerId, name: nguoi.name, ok: true });
    } catch (e) {
      ketQua.push({ managerId, name: nguoi.name, ok: false, ly_do: e.message });
    }
  }

  await ghiLogKetQua(ketQua);
  return ketQua;
}

async function ghiLogKetQua(ketQua) {
  const thanhCong = ketQua.filter(k => k.ok).length;
  const loi = ketQua.filter(k => !k.ok);
  const detail = loi.length
    ? `Gửi ${thanhCong}/${ketQua.length} người. Lỗi: ${loi.map(l => `${l.name} (${l.ly_do})`).join('; ')}`
    : `Gửi ${thanhCong}/${ketQua.length} người, không có lỗi`;

  await audit.ghiNhatKy({
    user: null, // hệ thống tự chạy, không có người thao tác
    action: 'reminder_sent',
    entity: 'reminder',
    entity_name: 'Nhắc việc định kỳ qua mail',
    detail,
  });
}

module.exports = { guiNhacNhoDinhKy };
