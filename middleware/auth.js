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

module.exports = { requireAuth, requireAdmin };
