/* TẦNG SERVICE — nghiệp vụ xác thực & quản lý người dùng.
   Không import express, không nhận req/res. Báo lỗi bằng cách throw AppError.

   GHI CHÚ CHO ĐỢT SAU (SmartEVN):
   hàm dangNhap() bên dưới là chỗ DUY NHẤT cần thêm nhánh gọi API EVN.
   Cấu trúc đã tách sẵn để không phải sửa route hay repository. */
const bcrypt   = require('bcryptjs');
const userRepo = require('../repositories/user.repo');
const audit    = require('./audit.service');
const config   = require('../config');
const smartevn = require('./smartevn.service');
const evnLogin = require('./evnLogin.service');
const permission = require('./permission.service');
const siteService = require('./site.service');
const { AppError, badRequest, unauthorized, notFound } = require('../utils/AppError');

const MAT_KHAU_TOI_THIEU = 6;
const BCRYPT_ROUNDS      = 10;

/* Chỉ chấp nhận đúng 2 vai trò; giá trị lạ đều quy về 'user'. */
const chuanHoaVaiTro = (role) => (role === 'admin' ? 'admin' : 'user');

/* Thông tin user lưu vào session — cố tình KHÔNG chứa password_hash.
   Có auth_source để frontend biết tài khoản EVN -> ẩn form đổi mật khẩu
   local, dẫn ra trang SmartEVN thay vào đó.
   `site` = không gian dữ liệu đang làm việc, suy từ don_vi_id (admin đổi được). */
const thongTinPhien = (user) => ({
  id:          user.id,
  username:    user.username,
  name:        user.name,
  role:        user.role,
  cap_bac:     permission.xacDinhCapBac(user),
  auth_source: user.auth_source || 'local',
  don_vi_id:   user.don_vi_id ?? null,
  site:        siteService.siteTheoDonVi(user.don_vi_id),
});

/* Thông tin site gửi kèm cho frontend (tên hiển thị, có trang phụ không,
   danh sách site để admin chuyển). Khách chưa đăng nhập -> site mặc định. */
function thongTinSite(phien) {
  const site = siteService.siteCua(phien);
  return {
    ...siteService.thongTin(site),
    ...(phien?.role === 'admin' ? { cacSite: siteService.danhSach() } : {}),
  };
}

/* /me: phiên hiện tại kèm thông tin site (null nếu chưa đăng nhập). */
const nguoiDungHienTai = (phien) => (phien ? { ...phien, site_info: thongTinSite(phien) } : null);

/* Admin chuyển site đang làm việc. Trả về phiên mới để route ghi lại session. */
function chuyenSite(phien, site) {
  if (!siteService.hopLe(site)) throw badRequest('Site không hợp lệ');
  return { ...phien, site };
}

function kiemTraDoDaiMatKhau(matKhau) {
  if (!matKhau || String(matKhau).length < MAT_KHAU_TOI_THIEU) {
    throw badRequest(`Mật khẩu phải có ít nhất ${MAT_KHAU_TOI_THIEU} ký tự`);
  }
}

/* Ghi log đăng nhập + đóng gói kết quả trả về (dùng chung local & EVN). */
async function hoanTatDangNhap(user, mustChange, ip) {
  const phien = thongTinPhien(user);
  await audit.ghiNhatKy({
    user: phien, action: 'login', entity: 'user',
    entity_id: user.id, entity_name: user.name,
    detail: ip ? `IP: ${ip}` : undefined,
  });
  return { phien, ketQua: { ...nguoiDungHienTai(phien), must_change_password: !!mustChange } };
}

/* ── ĐĂNG NHẬP ──────────────────────────────────────────────
   Thứ tự:
     1. Thử tài khoản LOCAL (bcrypt). Nhờ đó admin local luôn vào được
        kể cả khi API EVN gặp sự cố.
     2. Không khớp local + đã bật EVN_AUTH_ENABLED -> thử qua SmartEVN,
        đúng thì tạo/đồng bộ (JIT) rồi cho vào.
   Tắt cờ EVN_AUTH_ENABLED -> hành vi y hệt bản GĐ2 (chỉ local). */
async function dangNhap({ username, password, ip }) {
  if (!username || !password) {
    throw badRequest('Thiếu tên đăng nhập hoặc mật khẩu');
  }
  const ten = String(username).trim();

  /* (1) LOCAL */
  const local = await userRepo.findByUsername(ten);
  if (local && !local.disabled && local.password_hash &&
      bcrypt.compareSync(password, local.password_hash)) {
    return hoanTatDangNhap(local, local.must_change_password, ip);
  }
  if (local && local.disabled) {
    throw unauthorized('Tài khoản của bạn đang bị khóa');
  }

  /* (2) SmartEVN */
  if (config.EVN_AUTH_ENABLED) {
    const kq = await smartevn.xacThuc(ten, password);
    if (kq.ok) {
      const user = await evnLogin.taoHoacDongBo(kq.user);
      if (user.disabled) throw unauthorized('Tài khoản của bạn đang bị khóa');
      return hoanTatDangNhap(user, false, ip);
    }
    const status = evnLogin.laLoiHaTang(kq.reason) ? 503 : 401;
    throw new AppError(status, evnLogin.dichLoi(kq.reason));
  }

  throw unauthorized('Tên đăng nhập hoặc mật khẩu không đúng');
}

/* ── HỒ SƠ NGƯỜI DÙNG HIỆN TẠI ─────────────────────────────
   Đọc lại bản ghi từ DB rồi trả về thông tin an toàn để hiển thị
   trang hồ sơ (KHÔNG kèm password_hash). Các cột đặc thù EVN
   (chức vụ, phòng ban, đơn vị) có thể null với tài khoản nội bộ. */
async function layHoSo(nguoiDung) {
  const user = await userRepo.findById(nguoiDung.id);
  if (!user) throw notFound('Không tìm thấy tài khoản');
  return {
    name:        user.name,
    username:    user.username,
    role:        user.role,
    cap_bac:     permission.xacDinhCapBac(user),
    chuc_danh:   user.chuc_danh   || null,
    phong_ban:   user.phong_ban   || null,
    don_vi:      user.don_vi      || null,
    don_vi_id:   user.don_vi_id   ?? null,
    site_ten:    siteService.thongTin(siteService.siteCua(nguoiDung)).ten,
    ma_nhan_vien: user.ma_nhan_vien || null,
    email:       user.email       || null,
    auth_source: user.auth_source || 'local',
  };
}

/* ── ĐỔI MẬT KHẨU CỦA CHÍNH MÌNH ──────────────────────────── */
async function doiMatKhau(nguoiDung, { old_password, new_password }) {
  kiemTraDoDaiMatKhau(new_password);

  const user = await userRepo.findById(nguoiDung.id);
  if (!user) throw notFound('Không tìm thấy tài khoản');

  /* Tài khoản EVN dùng mật khẩu SmartEVN, không đổi tại đây. */
  if (user.auth_source === 'evn' || !user.password_hash) {
    throw badRequest('Tài khoản SmartEVN đổi mật khẩu trên hệ thống EVN, không đổi tại đây');
  }

  if (!bcrypt.compareSync(old_password || '', user.password_hash)) {
    throw unauthorized('Mật khẩu hiện tại không đúng');
  }

  await userRepo.updatePassword(user.id, bcrypt.hashSync(new_password, BCRYPT_ROUNDS));
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'update', entity: 'user',
    entity_id: user.id, entity_name: user.name, detail: 'Đổi mật khẩu',
  });
}

/* ── QUẢN LÝ NGƯỜI DÙNG (admin) ───────────────────────────── */
async function danhSachNguoiDung() {
  const rows = await userRepo.findAllSafe();
  return rows.map(u => ({ ...u, disabled: !!u.disabled, cap_bac: permission.xacDinhCapBac(u) }));
}

async function taoNguoiDung(nguoiThucHien, { username, password, name, role }) {
  if (!username || !password || !name) throw badRequest('Thiếu thông tin bắt buộc');
  kiemTraDoDaiMatKhau(password);

  const ten = String(username).trim();
  if (await userRepo.existsByUsername(ten)) {
    throw badRequest('Tên đăng nhập đã tồn tại');
  }

  const id = await userRepo.insert({
    username:      ten,
    password_hash: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    name,
    role:          chuanHoaVaiTro(role),
  });

  await audit.ghiNhatKy({
    user: nguoiThucHien, action: 'create', entity: 'user',
    entity_id: id, entity_name: name,
  });
  return id;
}

async function capNhatNguoiDung(nguoiThucHien, id, { name, role, disabled, password }) {
  const user = await userRepo.findById(id);
  if (!user) throw notFound('Không tìm thấy tài khoản');

  if (id === nguoiThucHien.id && disabled) {
    throw badRequest('Không thể tự khóa tài khoản của chính mình');
  }

  const fields = [], params = [];
  if (name     !== undefined) { fields.push('name = ?');     params.push(name); }
  if (role     !== undefined) { fields.push('role = ?');     params.push(chuanHoaVaiTro(role)); }
  if (disabled !== undefined) { fields.push('disabled = ?'); params.push(disabled ? 1 : 0); }

  if (password) {
    kiemTraDoDaiMatKhau(password);
    /* Đặt lại mật khẩu -> buộc người dùng đổi ở lần đăng nhập kế tiếp. */
    fields.push('password_hash = ?', 'must_change_password = 1');
    params.push(bcrypt.hashSync(password, BCRYPT_ROUNDS));
  }

  await userRepo.updateFields(id, fields, params);
  await audit.ghiNhatKy({
    user: nguoiThucHien, action: 'update', entity: 'user',
    entity_id: id, entity_name: user.name,
  });
}

async function xoaNguoiDung(nguoiThucHien, id) {
  if (id === nguoiThucHien.id) {
    throw badRequest('Không thể tự xóa tài khoản của chính mình');
  }
  const user = await userRepo.findById(id);
  if (!user) throw notFound('Không tìm thấy tài khoản');

  await userRepo.remove(id);
  await audit.ghiNhatKy({
    user: nguoiThucHien, action: 'delete', entity: 'user',
    entity_id: id, entity_name: user.name,
  });
}

module.exports = {
  dangNhap, layHoSo, doiMatKhau, thongTinSite, nguoiDungHienTai, chuyenSite,
  danhSachNguoiDung, taoNguoiDung, capNhatNguoiDung, xoaNguoiDung,
};
