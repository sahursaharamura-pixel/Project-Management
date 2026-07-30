'use strict';

/* ═══ AUTH STATE ═══ */
let currentUser = null;

/* Tài khoản SmartEVN không có mật khẩu local -> đổi mật khẩu phải qua
   trang này của EVN, không thể đổi trong ứng dụng. */
const EVN_PASSWORD_URL = 'https://lichtuan.evngenco2.vn/Auth/QuenMatKhau';

async function apiAuth(path, opts={}) {
  const r = await fetch('/api'+path,{
    headers:{'Content-Type':'application/json'},
    ...opts,
    body:opts.body?JSON.stringify(opts.body):undefined,
  });
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data.error||'Lỗi server');
  return data;
}

/* Gọi từ api() trong app.js khi gặp 401.
   Nếu trước đó đang có currentUser (tức phiên vừa hết hạn, không phải
   chưa từng đăng nhập) -> báo rõ lý do rồi mới mở lại form đăng nhập. */
function handleUnauthorized() {
  if (currentUser) {
    currentUser = null;
    updateAuthUI();
    toast?.('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', true);
  }
  openLoginModal();
}

async function initAuth() {
  try {
    currentUser = await apiAuth('/me');
  } catch(e) {
    currentUser = null;
  }
  updateAuthUI();
}

function updateAuthUI() {
  const el = document.getElementById('auth-widget');
  const adminLink = document.getElementById('sidebar-group-admin');
  const dangerZone = document.getElementById('danger-zone-reset');
  if (!el) return;

  if (currentUser) {
    const laTaiKhoanEVN = currentUser.auth_source === 'evn';
    const nutDoiMatKhau = laTaiKhoanEVN
      ? `<a href="${EVN_PASSWORD_URL}" target="_blank" rel="noopener" onclick="closeUserMenu()">🔑 Đổi mật khẩu</a>`
      : `<button type="button" onclick="closeUserMenu();openPasswordModal()">🔑 Đổi mật khẩu</button>`;

    el.innerHTML = `
      <div class="user-menu" id="user-menu">
        <button type="button" class="user-menu-trigger" onclick="toggleUserMenu(event)">
          <span>👤 ${escapeHtml(currentUser.name)}${currentUser.role==='admin'?' <span style="opacity:.6">(Admin)</span>':''}</span>
          <span class="user-menu-caret">▾</span>
        </button>
        <div class="user-menu-dropdown" id="user-menu-dropdown">
          <button type="button" onclick="closeUserMenu();openProfile()">🪪 Hồ sơ người dùng</button>
          ${nutDoiMatKhau}
          <button type="button" onclick="closeUserMenu();doLogout()">🚪 Đăng xuất</button>
        </div>
      </div>`;
    if (adminLink) adminLink.style.display = currentUser.role==='admin' ? '' : 'none';
    if (dangerZone) dangerZone.style.display = currentUser.role==='admin' ? '' : 'none';
    /* Tài khoản EVN không có mật khẩu local -> không tự bật form đổi
       mật khẩu nội bộ (kể cả khi cờ must_change_password bật nhầm). */
    if (currentUser.must_change_password && !laTaiKhoanEVN) {
      toast?.('Vui lòng đổi mật khẩu mặc định', true);
      openPasswordModal();
    }
  } else {
    el.innerHTML = `<button onclick="openLoginModal()" style="background:rgba(255,255,255,.2);color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer">🔐 Đăng nhập</button>`;
    if (adminLink) adminLink.style.display = 'none';
    if (dangerZone) dangerZone.style.display = 'none';
  }
}

function toggleUserMenu(e) {
  e.stopPropagation();
  document.getElementById('user-menu')?.classList.toggle('open');
  document.getElementById('user-menu-dropdown')?.classList.toggle('open');
}
function closeUserMenu() {
  document.getElementById('user-menu')?.classList.remove('open');
  document.getElementById('user-menu-dropdown')?.classList.remove('open');
}
document.addEventListener('click', (e) => {
  const menu = document.getElementById('user-menu');
  if (menu && !menu.contains(e.target)) closeUserMenu();
});

function escapeHtml(s) {
  return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* ═══ LOGIN MODAL ═══ */
function openLoginModal() {
  document.getElementById('login-error').style.display='none';
  document.getElementById('login-username').value='';
  document.getElementById('login-password').value='';
  document.getElementById('login-password').type='password';
  document.getElementById('modal-login').style.display='flex';
  setTimeout(()=>document.getElementById('login-username').focus(),50);

  const ipEl = document.getElementById('login-ip');
  if (ipEl) {
    ipEl.textContent = 'đang lấy...';
    apiAuth('/client-ip').then(d => { ipEl.textContent = d.ip || 'Không xác định'; })
                          .catch(() => { ipEl.textContent = 'Không xác định'; });
  }
}
function closeLoginModal() {
  document.getElementById('modal-login').style.display='none';
}

function toggleLoginPwVisibility() {
  const inp = document.getElementById('login-password');
  const eye = document.getElementById('login-pw-eye');
  const showing = inp.type === 'text';
  inp.type = showing ? 'password' : 'text';
  eye.innerHTML = showing
    ? '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/>'
    : '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.9 20.9 0 0 1 5.06-6.06M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.9 20.9 0 0 1-3.22 4.53M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
}

async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display='none';
  if (!username || !password) {
    errEl.textContent='Vui lòng nhập đầy đủ thông tin';
    errEl.style.display='block';
    return;
  }
  try {
    currentUser = await apiAuth('/login', { method:'POST', body:{ username, password } });
    closeLoginModal();
    updateAuthUI();
    toast?.('Đăng nhập thành công: '+currentUser.name);
  } catch(e) {
    errEl.textContent = e.message;
    errEl.style.display='block';
  }
}

async function doLogout() {
  await apiAuth('/logout', { method:'POST' }).catch(()=>{});
  currentUser = null;
  updateAuthUI();
  toast?.('Đã đăng xuất');
  if (typeof showPage==='function') showPage('dashboard');
}

/* ═══ ĐỔI MẬT KHẨU ═══ */
function openPasswordModal() {
  document.getElementById('pw-error').style.display='none';
  document.getElementById('pw-old').value='';
  document.getElementById('pw-new').value='';
  document.getElementById('pw-new-confirm').value='';
  document.getElementById('modal-password').style.display='flex';
}
function closePasswordModal() {
  document.getElementById('modal-password').style.display='none';
}
async function doChangePassword() {
  const old_password = document.getElementById('pw-old').value;
  const new_password = document.getElementById('pw-new').value;
  const new_password_confirm = document.getElementById('pw-new-confirm').value;
  const errEl = document.getElementById('pw-error');
  errEl.style.display='none';

  if (new_password.length < 6) {
    errEl.textContent = 'Mật khẩu mới phải có tối thiểu 6 ký tự';
    errEl.style.display='block';
    return;
  }
  if (new_password !== new_password_confirm) {
    errEl.textContent = 'Mật khẩu nhập lại không khớp';
    errEl.style.display='block';
    return;
  }

  try {
    await apiAuth('/me/password', { method:'POST', body:{ old_password, new_password } });
    closePasswordModal();
    toast?.('Đã đổi mật khẩu');
  } catch(e) {
    errEl.textContent = e.message;
    errEl.style.display='block';
  }
}

/* ═══ QUẢN LÝ NGƯỜI DÙNG (admin) ═══ */
let editingUserId = null;

async function loadUsersAndAudit() {
  try {
    const [users, logs] = await Promise.all([apiAuth('/users'), apiAuth('/audit-log')]);
    renderUsers(users);
    renderAuditLog(logs);
  } catch(e) {
    toast?.(e.message, true);
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = users.map(u => `
    <tr>
      <td>${escapeHtml(u.username)}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${u.role==='admin'?'⭐ Quản trị viên':'Người dùng'}</td>
      <td>${u.disabled?'<span style="color:#dc2626">Đã khóa</span>':'<span style="color:#059669">Hoạt động</span>'}</td>
      <td>${new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
      <td style="text-align:center;white-space:nowrap">
        <button class="btn-outline btn-sm" onclick="editUser(${u.id},'${escapeHtml(u.username)}','${escapeHtml(u.name)}','${u.role}')">✏️</button>
        <button class="btn-outline btn-sm" onclick="toggleUserDisabled(${u.id},${!u.disabled})">${u.disabled?'🔓 Mở khóa':'🔒 Khóa'}</button>
        <button class="btn-outline btn-sm" onclick="deleteUser(${u.id},'${escapeHtml(u.name)}')" style="color:#dc2626">🗑</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;color:#94a3b8">Chưa có tài khoản</td></tr>';
}

const AUDIT_ACTION_LABEL = {
  create:'➕ Tạo mới', update:'✏️ Cập nhật', delete:'🗑 Xóa',
  archive:'📦 Lưu trữ', unarchive:'♻️ Khôi phục', login:'🔐 Đăng nhập', logout:'🚪 Đăng xuất',
};
const AUDIT_ENTITY_LABEL = { project:'Dự án', item:'Hạng mục', tinh_hinh:'Tình hình triển khai', user:'Tài khoản' };

function renderAuditLog(logs) {
  const tbody = document.getElementById('audit-tbody');
  if (!tbody) return;
  tbody.innerHTML = logs.map(l => `
    <tr>
      <td style="white-space:nowrap">${new Date(l.created_at).toLocaleString('vi-VN')}</td>
      <td>${escapeHtml(l.name)} <span style="color:#94a3b8">(${escapeHtml(l.username)})</span></td>
      <td>${AUDIT_ACTION_LABEL[l.action]||l.action}</td>
      <td>${AUDIT_ENTITY_LABEL[l.entity]||l.entity}</td>
      <td>${escapeHtml(l.entity_name)}${l.detail?' — '+escapeHtml(l.detail):''}</td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Chưa có nhật ký</td></tr>';
}

function openUserForm() {
  editingUserId = null;
  document.getElementById('uf-username').value='';
  document.getElementById('uf-username').disabled=false;
  document.getElementById('uf-name').value='';
  document.getElementById('uf-password').value='';
  document.getElementById('uf-role').value='user';
  document.getElementById('uf-pass-req').style.display='inline';
  document.getElementById('user-form-wrap').style.display='block';
}
function editUser(id, username, name, role) {
  editingUserId = id;
  document.getElementById('uf-username').value = username;
  document.getElementById('uf-username').disabled = true;
  document.getElementById('uf-name').value = name;
  document.getElementById('uf-password').value = '';
  document.getElementById('uf-role').value = role;
  document.getElementById('uf-pass-req').style.display='none';
  document.getElementById('user-form-wrap').style.display='block';
}
function closeUserForm() {
  document.getElementById('user-form-wrap').style.display='none';
}

async function saveUser() {
  const username = document.getElementById('uf-username').value.trim();
  const name = document.getElementById('uf-name').value.trim();
  const password = document.getElementById('uf-password').value;
  const role = document.getElementById('uf-role').value;
  if (!name) return toast?.('Vui lòng nhập họ tên', true);
  try {
    if (editingUserId) {
      await apiAuth('/users/'+editingUserId, { method:'PUT', body:{ name, role, password: password||undefined } });
      toast?.('Đã cập nhật tài khoản');
    } else {
      if (!username) return toast?.('Vui lòng nhập tên đăng nhập', true);
      if (!password) return toast?.('Vui lòng nhập mật khẩu', true);
      await apiAuth('/users', { method:'POST', body:{ username, name, password, role } });
      toast?.('Đã tạo tài khoản');
    }
    closeUserForm();
    loadUsersAndAudit();
  } catch(e) {
    toast?.(e.message, true);
  }
}

async function toggleUserDisabled(id, disabled) {
  try {
    await apiAuth('/users/'+id, { method:'PUT', body:{ disabled } });
    toast?.(disabled?'Đã khóa tài khoản':'Đã mở khóa tài khoản');
    loadUsersAndAudit();
  } catch(e) {
    toast?.(e.message, true);
  }
}

async function deleteUser(id, name) {
  if (!confirm(`Xóa tài khoản "${name}"?`)) return;
  try {
    await apiAuth('/users/'+id, { method:'DELETE' });
    toast?.('Đã xóa tài khoản');
    loadUsersAndAudit();
  } catch(e) {
    toast?.(e.message, true);
  }
}

/* ═══ HỒ SƠ NGƯỜI DÙNG ═══ */
const ROLE_LABEL = { admin: '⭐ Quản trị viên', user: 'Người dùng' };
const AUTH_SOURCE_LABEL = { evn: 'Tài khoản SmartEVN', local: 'Tài khoản nội bộ' };

/* Chuyển sang trang hồ sơ (định tuyến qua showPage trong app.js). */
function openProfile() {
  if (!currentUser) return openLoginModal();
  if (typeof showPage === 'function') showPage('ho-so');
}

/* Được showPage('ho-so') gọi: tải dữ liệu hồ sơ rồi render. */
async function loadProfile() {
  const box = document.getElementById('profile-box');
  if (box) box.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:32px">Đang tải hồ sơ…</div>';
  try {
    const p = await apiAuth('/me/profile');
    renderProfile(p);
  } catch (e) {
    if (box) box.innerHTML = `<div style="color:#dc2626;padding:24px">${escapeHtml(e.message)}</div>`;
  }
}

function renderProfile(p) {
  const box = document.getElementById('profile-box');
  if (!box) return;
  const val = v => (v ? escapeHtml(v) : '<span style="color:#94a3b8">—</span>');

  const rows = [
    ['Họ và tên',      val(p.name)],
    ['Tên đăng nhập',  val(p.username)],
    ['Chức vụ',        val(p.chuc_danh)],
    ['Phòng ban',      val(p.phong_ban)],
    //['Đơn vị',         val(p.don_vi)],
    ['Quyền hạn',      ROLE_LABEL[p.role] || escapeHtml(p.role)],
  ];

  const initial = escapeHtml((p.name || '?').trim().charAt(0).toUpperCase());
  const nguon   = AUTH_SOURCE_LABEL[p.auth_source] || AUTH_SOURCE_LABEL.local;

  box.innerHTML = `
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
      <div style="display:flex;align-items:center;gap:16px;padding:24px;background:linear-gradient(135deg,#1e3a8a,#2563eb);color:#fff">
        <div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;flex-shrink:0">${initial}</div>
        <div style="min-width:0">
          <div style="font-size:20px;font-weight:800;line-height:1.3">${escapeHtml(p.name || '')}</div>
          <div style="opacity:.85;font-size:13px;margin-top:2px">${nguon}${p.ma_nhan_vien ? ' · Mã NV: ' + escapeHtml(p.ma_nhan_vien) : ''}</div>
        </div>
      </div>
      <div style="padding:8px 24px 20px">
        ${rows.map(([k, v]) => `
          <div style="display:flex;padding:14px 0;border-bottom:1px solid #f1f5f9;font-size:14px">
            <div style="width:150px;flex-shrink:0;color:#64748b;font-weight:600">${k}</div>
            <div style="color:#0f172a;font-weight:600;word-break:break-word">${v}</div>
          </div>`).join('')}
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', initAuth);
