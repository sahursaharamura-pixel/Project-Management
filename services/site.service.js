/* TẦNG SERVICE — "site" = không gian dữ liệu riêng của từng đơn vị.
   Cùng 1 server, 1 DB, 1 địa chỉ; dự án/hạng mục/lưu trữ của mỗi site tách
   riêng hoàn toàn nhờ cột `site` trên bảng projects và archives.

   Site của người dùng suy ra từ don_vi_id (SmartEVN trả về lúc đăng nhập):
   - don_vi_id nằm trong donViIds của site nào -> vào site đó.
   - Còn lại (đơn vị khác, tài khoản nội bộ, khách chưa đăng nhập) -> site mặc định.
   Admin được chuyển qua lại giữa các site (lưu trong session).

   Thêm đơn vị mới: thêm 1 mục vào SITES, không cần sửa chỗ nào khác. */
const { notFound, forbidden } = require('../utils/AppError');

const SITES = {
  khcn:   { ten: 'Ban KHCN&CĐS', donViIds: [],   coTrangPhu: true  },
  thacmo: { ten: 'Thác Mơ',      donViIds: [30], coTrangPhu: false },
};
const SITE_MAC_DINH = 'khcn';

const hopLe = (site) => Object.prototype.hasOwnProperty.call(SITES, site);

function siteTheoDonVi(donViId) {
  const id = Number(donViId);
  const tim = Object.entries(SITES).find(([, s]) => s.donViIds.includes(id));
  return tim ? tim[0] : SITE_MAC_DINH;
}

/* Site đang làm việc của người dùng trong session (null = khách). */
const siteCua = (user) => (user && hopLe(user.site) ? user.site : SITE_MAC_DINH);

const thongTin = (site) => ({ site, ten: SITES[site].ten, coTrangPhu: SITES[site].coTrangPhu });

const danhSach = () => Object.keys(SITES).map(thongTin);

/* Bản ghi không thuộc site đang làm việc -> báo "không tìm thấy" như thể
   không tồn tại, để không lộ dữ liệu site khác. */
function kiemTraThuoc(site, siteBanGhi, thongBao = 'Không tìm thấy dữ liệu') {
  if (!siteBanGhi || siteBanGhi !== site) throw notFound(thongBao);
}

/* Trang "Định hướng KHCN" / "KH SXKD" chỉ có ở site bật coTrangPhu. */
function kiemTraTrangPhu(site) {
  if (!SITES[site].coTrangPhu) throw forbidden('Trang này không áp dụng cho đơn vị của bạn');
}

module.exports = {
  SITES, SITE_MAC_DINH, hopLe, siteTheoDonVi, siteCua, thongTin, danhSach,
  kiemTraThuoc, kiemTraTrangPhu,
};
