/* Gọi API đăng nhập SmartEVN (EVNGENCO2).
   Chỉ chịu trách nhiệm nói chuyện với API — không đụng DB, không đụng session.

   Tài liệu API: POST {BASE}/auth/login
     Header: X-Api-Key, Content-Type: application/json
     Body:   { username, password }
     OK:     { authenticated: true, user: { username, hoTen, chucDanh, maNhanVien, email, ... } }
     Sai:    { authenticated: false, reason: 'invalid_credentials' | 'locked' | ... }

   GET {BASE}/users/{username} — tra hồ sơ 1 người (không cần mật khẩu)
     Header: X-Api-Key
     OK:     { username, hoTen, chucDanh, maNhanVien, email, donVi: { id }, phongBan: { ... } }
     Không có người này: 404
*/
const config = require('../config');

/* Timeout để không treo request nếu API EVN không phản hồi. */
const TIMEOUT_MS = 10000;

/* Kết quả trả về cho tầng gọi, ở dạng thống nhất:
     { ok: true,  user }                      -> xác thực thành công
     { ok: false, reason, httpStatus }        -> thất bại, kèm lý do
   Tầng auth.service sẽ dịch reason -> thông báo tiếng Việt. */
async function xacThuc(username, password) {
  const base = (config.EVN_API_BASE || '').replace(/\/+$/, '');  // bỏ dấu / cuối
  const url  = `${base}/auth/login`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-Api-Key':    config.EVN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    /* Mất mạng, DNS lỗi, hoặc quá TIMEOUT_MS (AbortError). */
    const reason = e.name === 'AbortError' ? 'timeout' : 'network_error';
    return { ok: false, reason, httpStatus: 0 };
  }
  clearTimeout(timer);

  let data;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: 'bad_response', httpStatus: res.status };
  }

  if (data.authenticated === true && data.user) {
    return { ok: true, user: data.user };
  }
  return {
    ok: false,
    reason: data.reason || 'invalid_credentials',
    httpStatus: res.status,
  };
}

/* Tra hồ sơ theo tên đăng nhập (dùng cho SSO: myapps đã xác thực, chỉ còn cần hồ sơ).
   Trả về { ok: true, user } hoặc { ok: false, reason } như xacThuc. */
async function layNguoiDung(username) {
  const base = (config.EVN_API_BASE || '').replace(/\/+$/, '');
  try {
    const res = await fetch(`${base}/users/${encodeURIComponent(username)}`, {
      headers: { 'X-Api-Key': config.EVN_API_KEY },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (res.status === 404) return { ok: false, reason: 'not_found' };
    if (!res.ok) return { ok: false, reason: 'upstream_error' };
    return { ok: true, user: await res.json() };
  } catch (e) {
    const reason = e.name === 'TimeoutError' ? 'timeout'
                 : e instanceof SyntaxError   ? 'bad_response' : 'network_error';
    return { ok: false, reason };
  }
}

module.exports = { xacThuc, layNguoiDung };
