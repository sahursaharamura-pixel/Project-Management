/* TẦNG SERVICE — thao tác quản trị nguy hiểm. */
const { query } = require('../db/mysql');
const audit     = require('./audit.service');
const fileService = require('./tinhHinhFile.service');
const fileRepo    = require('../repositories/tinhHinhFile.repo');
const siteService = require('./site.service');

/* XÓA SẠCH dữ liệu nghiệp vụ CỦA SITE ĐANG LÀM VIỆC (site khác giữ nguyên).
   KHÔNG đụng tới bảng `users` và `audit_log` (giữ đúng hành vi cũ)
   -> tài khoản đăng nhập và lịch sử thao tác vẫn còn nguyên.

   Xóa projects -> items, tinh_hinh, tinh_hinh_files tự xóa theo (ON DELETE CASCADE).
   Không reset AUTO_INCREMENT nữa vì các site dùng chung bảng. File trên đĩa
   phải lấy danh sách trước khi xóa DB rồi mới dọn. */
async function resetToanBoDuLieu(nguoiDung) {
  const site  = siteService.siteCua(nguoiDung);
  const files = await fileRepo.findTenLuuBySite(site);

  await query('DELETE FROM archives WHERE site = ?', [site]);
  await query('DELETE FROM projects WHERE site = ?', [site]);
  await fileService.xoaTrenDia(files);

  await audit.ghiNhatKy({
    user: nguoiDung, action: 'delete', entity: 'project',
    entity_name: 'TOÀN BỘ DỮ LIỆU', detail: `Reset dữ liệu site ${siteService.thongTin(site).ten}`,
  });
}

module.exports = { resetToanBoDuLieu };
