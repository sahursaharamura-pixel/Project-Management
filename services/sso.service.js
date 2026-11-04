/* Nói chuyện với myapps.evngenco2.vn theo chuẩn OpenID Connect (Authorization
   Code + PKCE). Chỉ chịu trách nhiệm phần giao thức — không đụng DB, không đụng
   session; việc tra tài khoản và phân quyền nằm ở auth.service.

   Cấu hình đọc từ biến môi trường (đúng tên trong tài liệu của EVNGENCO2), do
   người vận hành điền khi cài đặt, không để trong mã nguồn:
     OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_PUBLIC_ORIGIN
   Để trống OIDC_ISSUER = tắt SSO, phần mềm chạy như cũ. */
const { Issuer, generators, custom } = require('openid-client');

const E = process.env;

/* Địa chỉ quay về luôn dựng từ OIDC_PUBLIC_ORIGIN, không dựng từ request: sau
   proxy HTTPS, máy chủ nhận http nên tự dựng sẽ ra http://... và myapps từ chối. */
const diaChiQuayVe = () => (E.OIDC_PUBLIC_ORIGIN || '').replace(/\/+$/, '') + '/signin-oidc';

custom.setHttpOptionsDefaults({ timeout: 15000 });

const daBat = () => !!E.OIDC_ISSUER;

/* Chỉ giữ client khi đã tải được cấu hình từ myapps; chưa tải được thì lần sau
   thử lại, nên myapps có trục trặc rồi khôi phục cũng không phải khởi động lại. */
let client = null;
async function layClient() {
  if (!client) {
    const issuer = await Issuer.discover(E.OIDC_ISSUER);
    client = new issuer.Client({
      client_id:      E.OIDC_CLIENT_ID,
      client_secret:  E.OIDC_CLIENT_SECRET,
      redirect_uris:  [diaChiQuayVe()],
      response_types: ['code'],
    });
  }
  return client;
}

/* Tạo địa chỉ chuyển sang myapps, kèm phần phải giữ trong session để đối chiếu
   ở chiều về. */
async function taoYeuCauDangNhap() {
  const c = await layClient();
  const verifier = generators.codeVerifier();
  const state    = generators.state();
  const url = c.authorizationUrl({
    scope: 'openid profile',
    state,
    code_challenge: generators.codeChallenge(verifier),
    code_challenge_method: 'S256',
  });
  return { url, oidc: { verifier, state } };
}

/* Đổi mã myapps trả về lấy tên đăng nhập EVNID. Sai state, mã hết hạn... -> throw. */
async function nhanKetQua(req, { verifier, state }) {
  const c = await layClient();
  const token = await c.callback(diaChiQuayVe(), c.callbackParams(req), { code_verifier: verifier, state });
  return token.claims().preferred_username;
}

module.exports = { daBat, taoYeuCauDangNhap, nhanKetQua };
