/* Gọi API đăng nhập SmartEVN (EVNGENCO2).
   Chỉ chịu trách nhiệm nói chuyện với API — không đụng DB, không đụng session.

   Tài liệu API: POST {BASE}/auth/login
     Header: X-Api-Key, Content-Type: application/json
     Body:   { username, password }
     OK:     { authenticated: true, user: { username, hoTen, chucDanh, maNhanVien, email, ... } }
     Sai:    { authenticated: false, reason: 'invalid_credentials' | 'locked' | ... }
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

module.exports = { xacThuc };
