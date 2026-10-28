function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để thực hiện thao tác này' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền thực hiện thao tác này' });
  }
  next();
}

/* Chặn thao tác nhập liệu (thêm/sửa/xóa dữ liệu nghiệp vụ) với tài khoản
   cấp "lãnh đạo" — nhóm này chỉ được xem dashboard/báo cáo. */
function requireNhapLieu(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  }
  if (req.session.user.cap_bac === 'lanh_dao') {
    return res.status(403).json({ error: 'Tài khoản lãnh đạo chỉ được xem dashboard và báo cáo, không có quyền nhập liệu' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin, requireNhapLieu };
