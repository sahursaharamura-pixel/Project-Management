/* ═══ KH SXKD 2026 - Mua sắm TSCĐ / Chi phí hoạt động / Đối chiếu đầu mục (Ban KHCNCĐS) ═══
   Toàn bộ biến/hàm được đặt tiền tố "Sxkd/sxkd" để không trùng với khcn.js (GROUPS, DATA,
   currentFilter, render, filterCat, uid, modalOverlay... đã được khcn.js dùng làm biến/id
   toàn cục). Đồng bộ hành vi với trang KHCN: click 1 hạng mục sẽ mở form chi tiết ngay bên
   dưới, có thể Thêm / Sửa / Xóa hạng mục ở cả 3 bảng. */

const SXKD_TSCD = [
  {id:'t1',  stt:1,  title:'Nâng cấp hệ thống kiểm kê vật tư, tài sản, công cụ dụng cụ cho Cơ quan Tổng công ty Phát điện 2 và các đơn vị hạch toán phụ thuộc', note:'Nâng cấp phiên bản phần mềm cho hệ thống', budget:2600, unit:'Ban KHCNCĐS', status:''},
  {id:'t2',  stt:2,  title:'Nâng cấp và triển khai hệ thống lịch tuần, lịch xe, lịch công tác khác trong Tổng công ty Phát điện 2', note:'Xây dựng lịch tuần, lịch xe, lịch công tác khác dùng chung toàn EVNGENCO2 (tập trung)', budget:1500, unit:'Ban KHCNCĐS', status:''},
  {id:'t3',  stt:3,  title:'Phần mềm quản lý kế hoạch, dự án và công việc Tổng công ty Phát điện 2', note:'Đã được HĐQT thông qua chủ trương tại NQ 337/NQ-HĐQT ngày 21/7/2025', budget:0, unit:'Ban KHCNCĐS', status:'hold', statusLabel:'Không triển khai (thay bằng mục 11)'},
  {id:'t4',  stt:4,  title:'Cung cấp hàng hóa, thiết lập hệ thống, tổ chức đào tạo hướng dẫn sử dụng hệ thống đảm bảo an toàn an ninh thông tin cho các nhà máy điện thuộc EVNGENCO2', note:'', budget:0, unit:'Ban KHCNCĐS', status:'review', statusLabel:'Chưa có khái toán'},
  {id:'t5',  stt:5,  title:'Thiết bị quản lý truy cập Network Access Control (NAC)', note:'2 Thiết bị Firewall Appliance + 2 Firewall License', budget:150, unit:'Ban KHCNCĐS', status:''},
  {id:'t6',  stt:6,  title:'Thiết bị tường lửa thế hệ mới', note:'Thay thế thiết bị tường lửa Check Point 3200 không còn hỗ trợ từ NCC', budget:870, unit:'Ban KHCNCĐS', status:''},
  {id:'t7',  stt:7,  title:'Ứng dụng trí tuệ nhân tạo để tự động hoá nghiệp vụ liên quan CNTT trong Tổng công ty Phát điện 2', note:'Theo báo cáo số 1819/EVNGENCO2-KTSX ngày 12/5/2025', budget:1200, unit:'Ban KHCNCĐS', status:''},
  {id:'t8',  stt:8,  title:'Hệ thống lưu trữ dữ liệu trực tuyến của EVNGENCO2', note:'Lưu trữ dữ liệu, máy chủ quan trọng theo chính sách 3-2-1-0', budget:5000, unit:'Ban KHCNCĐS', status:''},
  {id:'t9',  stt:9,  title:'Gói vật tư chiến lược phục vụ quản lý vận hành hệ thống VTCNTT cơ quan TCT', note:'Thiết bị dự phòng chiến lược ứng cứu sự cố hệ thống VTCNTT TCT', budget:5000, unit:'Ban KHCNCĐS', status:''},
  {id:'t10', stt:10, title:'Hệ thống cổng Portal của EVNGENCO2', note:'Xây dựng cổng Portal tích hợp ứng dụng thông minh, trí tuệ nhân tạo quản lý điều hành', budget:8000, unit:'Ban KHCNCĐS', status:''},
  {id:'t11', stt:11, title:'Triển khai Hệ sinh thái văn phòng số trên nền tảng Microsoft Office 365', note:"Thay đổi từ hạng mục 'PM quản lý KH, dự án, công việc' (dòng 3) do thay đổi mục tiêu, nội dung", budget:595, unit:'Ban KHCNCĐS', status:''},
];

const SXKD_CPHD = [
  {id:'c1',  stt:'7.1',  title:'Gia hạn license và dịch vụ hỗ trợ kỹ thuật thiết bị firewall tại Sông Bung, An Khê - Ka Nak, dịch vụ hỗ trợ kỹ thuật hệ thống ESM tại Tổng công ty', budget:1600, note:'Phần khối lượng phân bổ tại Cơ quan TCT', status:''},
  {id:'c2',  stt:'7.2',  title:'Gia hạn license và dịch vụ hỗ trợ kỹ thuật hệ thống SOC và hệ thống IPS', budget:4024, note:'', status:''},
  {id:'c3',  stt:'7.3',  title:'Gia hạn license và dịch vụ hỗ trợ kỹ thuật hệ thống PIM, APT, FW MNGT, Backup & Storage', budget:2444, note:'', status:''},
  {id:'c4',  stt:'7.4',  title:'Gia hạn license và dịch vụ hỗ trợ kỹ thuật cho các thiết bị tường lửa tại Cơ quan Tổng công ty và các Đơn vị phụ thuộc', budget:6036, note:'', status:''},
  {id:'c5',  stt:'7.5',  title:'Gia hạn bản quyền hệ thống SDWAN', budget:2700, note:'', status:''},
  {id:'c6',  stt:'7.6',  title:'Rà quét đánh giá điểm yếu, lỗ hổng bảo mật cho các hệ thống năm 2026', budget:800, note:'', status:''},
  {id:'c7',  stt:'7.7',  title:'Thuê chuyên gia ngoài và đại diện của các tổ chức uy tín hỗ trợ xây dựng Trung tâm Điều khiển và Giám sát từ xa các nhà máy điện', budget:300, note:'', status:''},
  {id:'c8',  stt:'7.8',  title:'Gia hạn license dịch vụ email domain evngenco2.vn', budget:417, note:'', status:'done', statusLabel:'đã làm'},
  {id:'c9',  stt:'7.9',  title:'Gia hạn dịch vụ hỗ trợ kỹ thuật hệ thống Oracle', budget:549, note:'', status:'done', statusLabel:'đã làm'},
  {id:'c10', stt:'7.10', title:'Gia hạn phần mềm bản quyền Office 365', budget:478, note:'', status:'done', statusLabel:'đã làm'},
  {id:'c11', stt:'7.11', title:'Dịch vụ bảo trì các phần mềm dùng chung của EVNICT', budget:408, note:'', status:''},
  {id:'c12', stt:'7.12', title:'Dịch vụ diễn tập thực chiến hệ thống CNTT EVNGENCO2', budget:500, note:'', status:''},
  {id:'c13', stt:'7.13', title:'Dịch vụ duy trì, tổ chức đánh giá, cấp giấy chứng nhận hệ thống an toàn thông tin (ISMS) theo ISO/IEC 27001:2022', budget:368, note:'', status:''},
  {id:'c14', stt:'7.15', title:'Chi phí thực hiện Hợp đồng triển khai hệ thống E-Payment và dịch vụ hỗ trợ vận hành phân hệ tính lương (Payroll)', budget:217, note:'Bổ sung theo báo cáo số 55/KHCNCĐS ngày 14/01/2026', status:''},
];

const SXKD_DOICHIEU = [
  {id:'d1', tsc:'6. Thiết bị tường lửa thế hệ mới (mua thiết bị mới thay Check Point 3200) - 870tr', cp:'7.4 Gia hạn license & DVHT KT cho các thiết bị tường lửa tại CQ TCT và đơn vị phụ thuộc - 6.036tr', note:"Không trùng đầu mục (một bên mua mới thiết bị/TSCĐ, một bên gia hạn license/dịch vụ cho thiết bị đang vận hành), nhưng cùng chủ đề 'tường lửa' - nên đối chiếu tránh chồng lấn phạm vi/nguồn vốn."},
  {id:'d2', tsc:'11. Triển khai Hệ sinh thái văn phòng số trên nền Microsoft Office 365 - 595tr', cp:'7.10 Gia hạn phần mềm bản quyền Office 365 - 478tr', note:'Không trùng đầu mục (một bên đầu tư/triển khai hệ sinh thái mới, một bên gia hạn bản quyền hiện hữu), nhưng cùng nền tảng Office 365 - nên đối chiếu phạm vi công việc.'},
];

let sxkdFilter = '';
let sxkdExpandedRows = new Set();
let sxkdModalType = null;

/* ═══════════════════════════════════════
   LƯU TRỮ TRÊN SERVER (file data/sxkd-data.json — không dùng MySQL)
   SXKD_TSCD/SXKD_CPHD/SXKD_DOICHIEU ở trên là dữ liệu mặc định (dùng khi chưa gọi được
   API). Khi tải trang thành công sẽ nạp đè từ server; sau mỗi lần thêm/sửa/xóa sẽ lưu
   ngược lại lên server để người khác mở trang cũng thấy đúng bản mới nhất.
   ═══════════════════════════════════════ */
async function loadSxkdData() {
  try {
    const r = await fetch('/api/sxkd-data');
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Lỗi tải dữ liệu SXKD');
    if (Array.isArray(data.tscd) && data.tscd.length) { SXKD_TSCD.length = 0; SXKD_TSCD.push(...data.tscd); }
    if (Array.isArray(data.cphd) && data.cphd.length) { SXKD_CPHD.length = 0; SXKD_CPHD.push(...data.cphd); }
    if (Array.isArray(data.doichieu)) { SXKD_DOICHIEU.length = 0; SXKD_DOICHIEU.push(...data.doichieu); }
  } catch (e) {
    console.warn('Không tải được dữ liệu SXKD từ server, đang dùng dữ liệu mặc định trong trình duyệt:', e.message);
  }
}

async function saveSxkdData() {
  try {
    const r = await fetch('/api/sxkd-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tscd: SXKD_TSCD, cphd: SXKD_CPHD, doichieu: SXKD_DOICHIEU }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Lỗi lưu dữ liệu SXKD');
  } catch (e) {
    sxkdToast('⚠️ Không lưu được lên server (' + e.message + '). Thay đổi có thể mất khi tải lại trang.', true);
  }
}

/* ═══════════════════════════════════════
   FIELD SCHEMA (dùng chung cho form sửa + modal thêm mới)
   ═══════════════════════════════════════ */
const SXKD_STATUS_OPTIONS = [
  { value: '',       label: '— Bình thường —' },
  { value: 'hold',   label: 'Không triển khai' },
  { value: 'review', label: 'Chưa có khái toán' },
  { value: 'done',   label: 'Đã làm / hoàn thành' },
];

const SXKD_FIELD_DEFS = {
  tscd: [
    { key: 'stt',         label: 'STT',                              type: 'text' },
    { key: 'unit',        label: 'Ban thụ lý',                       type: 'text' },
    { key: 'title',       label: 'Đầu mục',                          type: 'textarea', span2: true },
    { key: 'note',        label: 'Đặc tính kỹ thuật / Ghi chú',      type: 'textarea', span2: true },
    { key: 'budget',      label: 'Giá trị đề xuất (Triệu đồng)',     type: 'number' },
    { key: 'status',      label: 'Tình trạng',                       type: 'select', options: SXKD_STATUS_OPTIONS },
    { key: 'statusLabel', label: 'Nhãn tình trạng (tuỳ chọn)',       type: 'text' },
  ],
  cphd: [
    { key: 'stt',         label: 'STT',                              type: 'text' },
    { key: 'title',       label: 'Đầu mục',                          type: 'textarea', span2: true },
    { key: 'budget',      label: 'Giá trị KH (Triệu đồng)',          type: 'number' },
    { key: 'note',        label: 'Ghi chú',                          type: 'text' },
    { key: 'status',      label: 'Tình trạng',                       type: 'select', options: SXKD_STATUS_OPTIONS },
    { key: 'statusLabel', label: 'Nhãn tình trạng (tuỳ chọn)',       type: 'text' },
  ],
  doichieu: [
    { key: 'tsc',  label: 'Đầu mục - TSCĐ (mua sắm)',              type: 'textarea', span2: true },
    { key: 'cp',   label: 'Đầu mục - Chi phí HĐ (tương ứng)',      type: 'textarea', span2: true },
    { key: 'note', label: 'Nhận xét',                               type: 'textarea', span2: true },
  ],
};

const SXKD_TYPE_LABEL = { tscd: '🛒 Mua sắm TSCĐ', cphd: '🧾 Chi phí hoạt động', doichieu: '📊 Đối chiếu đầu mục' };

function sxkdTypeMeta(type) {
  if (type === 'tscd') return { arr: SXKD_TSCD, builder: buildSxkdTscdRow };
  if (type === 'cphd') return { arr: SXKD_CPHD, builder: buildSxkdCphdRow };
  return { arr: SXKD_DOICHIEU, builder: buildSxkdDoichieuRow };
}

function sxkdUid(prefix) { return prefix + Date.now() + Math.random().toString(36).slice(2, 6); }

function sxkdToast(msg, isError) { if (typeof toast === 'function') toast(msg, !!isError); }

/* ═══════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════ */
function sxkdStatusBadge(status, label) {
  const map = { '': ['st-new', '—'], hold: ['st-hold', 'Không triển khai'], review: ['st-review', 'Chưa có khái toán'], done: ['st-done', 'đã làm'] };
  const [c, l] = map[status] || map[''];
  if (!status) return '<span class="tbd-text">—</span>';
  return `<span class="status-label ${c}">${esc(label) || l}</span>`;
}

function sxkdMatches(text, search) { return !search || (text || '').toLowerCase().includes(search); }

function sxkdFieldInput(type, id, f, val) {
  const fid = `sf_${type}_${id}_${f.key}`;
  if (f.type === 'select') {
    const opts = f.options.map(o => `<option value="${o.value}" ${val === o.value ? 'selected' : ''}>${o.label}</option>`).join('');
    return `<select class="form-select" id="${fid}">${opts}</select>`;
  }
  if (f.type === 'textarea') return `<textarea class="form-textarea" id="${fid}">${esc(val)}</textarea>`;
  if (f.type === 'number') return `<input class="form-input" type="number" id="${fid}" value="${val === null || val === undefined ? '' : val}">`;
  return `<input class="form-input" id="${fid}" value="${esc(val)}">`;
}

function buildSxkdEditForm(type, item) {
  const defs = SXKD_FIELD_DEFS[type];
  const fields = defs.map(f => `
    <div class="form-group ${f.span2 ? 'span2' : ''}">
      <label class="form-label">${f.label}</label>
      ${sxkdFieldInput(type, item.id, f, item[f.key])}
    </div>`).join('');
  return `
    <div class="form-grid">${fields}</div>
    <div class="form-row-actions">
      <button class="btn-cancel" onclick="cancelSxkdEdit('${type}','${item.id}')">Hủy</button>
      <button class="btn-save" onclick="saveSxkdEdit('${type}','${item.id}')">✓ Lưu thay đổi</button>
    </div>`;
}

/* ═══════════════════════════════════════
   ROW BUILDERS
   ═══════════════════════════════════════ */
function buildSxkdTscdRow(item) {
  const isExp = sxkdExpandedRows.has('tscd:' + item.id);
  const tr = document.createElement('tr');
  tr.className = 'khcn-tr khcn-lvl-1';
  tr.id = 'srow_tscd_' + item.id;
  tr.innerHTML = `
    <td class="khcn-td td-stt">${esc(item.stt)}</td>
    <td class="khcn-td td-title" onclick="toggleSxkdRow('tscd','${item.id}')">
      <span class="khcn-title-text l1">${esc(item.title)}</span>
      <div class="edit-form-td ${isExp ? 'open' : ''}" id="sef_tscd_${item.id}" onclick="event.stopPropagation()">
        ${buildSxkdEditForm('tscd', item)}
      </div>
    </td>
    <td class="khcn-td td-note" title="${esc(item.note) || ''}">${item.note ? `<span class="td-note-text">${esc(item.note)}</span>` : '<span class="tbd-text">—</span>'}</td>
    <td class="khcn-td td-budget">${item.budget ? `<span class="row-budget">${item.budget.toLocaleString('vi')} Tr.đ</span>` : '<span class="row-budget tbd">TBD</span>'}</td>
    <td class="khcn-td td-unit"><span class="row-badge badge-khcn">${esc(item.unit) || '—'}</span></td>
    <td class="khcn-td td-status">${sxkdStatusBadge(item.status, item.statusLabel)}</td>
    <td class="khcn-td td-actions">
      <div style="display:flex;gap:3px;justify-content:center">
        <button class="act-btn" title="Sửa" onclick="openSxkdEdit('tscd','${item.id}')">✏️</button>
        <button class="act-btn del" title="Xóa" onclick="deleteSxkdItem('tscd','${item.id}')">🗑</button>
      </div>
    </td>`;
  return tr;
}

function buildSxkdCphdRow(item) {
  const isExp = sxkdExpandedRows.has('cphd:' + item.id);
  const tr = document.createElement('tr');
  tr.className = 'khcn-tr khcn-lvl-1';
  tr.id = 'srow_cphd_' + item.id;
  tr.innerHTML = `
    <td class="khcn-td td-stt">${esc(item.stt)}</td>
    <td class="khcn-td td-title" onclick="toggleSxkdRow('cphd','${item.id}')">
      <span class="khcn-title-text l1">${esc(item.title)}</span>
      <div class="edit-form-td ${isExp ? 'open' : ''}" id="sef_cphd_${item.id}" onclick="event.stopPropagation()">
        ${buildSxkdEditForm('cphd', item)}
      </div>
    </td>
    <td class="khcn-td td-budget">${item.budget ? `<span class="row-budget">${item.budget.toLocaleString('vi')} Tr.đ</span>` : '<span class="row-budget tbd">TBD</span>'}</td>
    <td class="khcn-td td-note" title="${esc(item.note) || ''}">${item.note ? `<span class="td-note-text">${esc(item.note)}</span>` : (item.statusLabel ? `<span class="row-badge badge-sxkd">${esc(item.statusLabel)}</span>` : '<span class="tbd-text">—</span>')}</td>
    <td class="khcn-td td-unit"><span class="row-badge badge-khcn">KHCNCĐS</span></td>
    <td class="khcn-td td-actions">
      <div style="display:flex;gap:3px;justify-content:center">
        <button class="act-btn" title="Sửa" onclick="openSxkdEdit('cphd','${item.id}')">✏️</button>
        <button class="act-btn del" title="Xóa" onclick="deleteSxkdItem('cphd','${item.id}')">🗑</button>
      </div>
    </td>`;
  return tr;
}

function buildSxkdDoichieuRow(item, idx) {
  const isExp = sxkdExpandedRows.has('doichieu:' + item.id);
  const arrIdx = idx !== undefined ? idx : SXKD_DOICHIEU.indexOf(item);
  const tr = document.createElement('tr');
  tr.className = 'khcn-tr khcn-lvl-1';
  tr.id = 'srow_doichieu_' + item.id;
  tr.innerHTML = `
    <td class="khcn-td td-stt">${arrIdx + 1}</td>
    <td class="khcn-td td-title" onclick="toggleSxkdRow('doichieu','${item.id}')">
      <span class="khcn-title-text l1">${esc(item.tsc)}</span>
      <div class="edit-form-td ${isExp ? 'open' : ''}" id="sef_doichieu_${item.id}" onclick="event.stopPropagation()">
        ${buildSxkdEditForm('doichieu', item)}
      </div>
    </td>
    <td class="khcn-td td-title"><span class="khcn-title-text l1">${esc(item.cp)}</span></td>
    <td class="khcn-td td-status"><span class="status-label st-review">Cần rà soát</span></td>
    <td class="khcn-td td-note" title="${esc(item.note) || ''}">${item.note ? `<span class="td-note-text">${esc(item.note)}</span>` : '<span class="tbd-text">—</span>'}</td>
    <td class="khcn-td td-actions">
      <div style="display:flex;gap:3px;justify-content:center">
        <button class="act-btn" title="Sửa" onclick="openSxkdEdit('doichieu','${item.id}')">✏️</button>
        <button class="act-btn del" title="Xóa" onclick="deleteSxkdItem('doichieu','${item.id}')">🗑</button>
      </div>
    </td>`;
  return tr;
}

function buildSxkdTable(type, items) {
  const table = document.createElement('table');
  table.className = 'khcn-table';
  if (type === 'tscd') {
    table.innerHTML = `<thead><tr class="khcn-thead">
      <th class="khcn-th th-stt">STT</th><th class="khcn-th th-title">Đầu mục</th>
      <th class="khcn-th th-note">Đặc tính kỹ thuật / Ghi chú</th>
      <th class="khcn-th th-budget">Giá trị đề xuất<br><small style="font-weight:400;text-transform:none;letter-spacing:0">(Tr.đ)</small></th>
      <th class="khcn-th th-unit">Ban thụ lý</th><th class="khcn-th th-status">Tình trạng</th>
      <th class="khcn-th th-actions"></th></tr></thead>`;
  } else if (type === 'cphd') {
    table.innerHTML = `<thead><tr class="khcn-thead">
      <th class="khcn-th th-stt">STT</th><th class="khcn-th th-title">Đầu mục</th>
      <th class="khcn-th th-budget">Giá trị KH<br><small style="font-weight:400;text-transform:none;letter-spacing:0">(Tr.đ)</small></th>
      <th class="khcn-th th-note">Ghi chú</th><th class="khcn-th th-unit">Ban thụ lý</th>
      <th class="khcn-th th-actions"></th></tr></thead>`;
  } else {
    table.innerHTML = `<thead><tr class="khcn-thead">
      <th class="khcn-th th-stt">#</th><th class="khcn-th th-title">Đầu mục - TSCĐ (mua sắm)</th>
      <th class="khcn-th th-title">Đầu mục - Chi phí HĐ (tương ứng)</th>
      <th class="khcn-th th-status">Kết luận</th><th class="khcn-th th-note">Nhận xét</th>
      <th class="khcn-th th-actions"></th></tr></thead>`;
  }
  const tbody = document.createElement('tbody');
  const { builder } = sxkdTypeMeta(type);
  items.forEach((it, i) => tbody.appendChild(type === 'doichieu' ? builder(it, i) : builder(it)));
  table.appendChild(tbody);
  return table;
}

/* ═══════════════════════════════════════
   ROW EXPAND / EDIT / DELETE
   ═══════════════════════════════════════ */
function rerenderSxkdRow(type, id) {
  const { arr, builder } = sxkdTypeMeta(type);
  const item = arr.find(d => d.id === id);
  if (!item) return;
  const newRow = type === 'doichieu' ? builder(item, arr.indexOf(item)) : builder(item);
  const old = document.getElementById('srow_' + type + '_' + id);
  if (old) old.replaceWith(newRow);
}

function toggleSxkdRow(type, id) {
  const key = type + ':' + id;
  if (sxkdExpandedRows.has(key)) sxkdExpandedRows.delete(key);
  else sxkdExpandedRows.add(key);
  rerenderSxkdRow(type, id);
}

function openSxkdEdit(type, id) {
  const key = type + ':' + id;
  if (!sxkdExpandedRows.has(key)) {
    sxkdExpandedRows.add(key);
    rerenderSxkdRow(type, id);
  }
}

function cancelSxkdEdit(type, id) {
  sxkdExpandedRows.delete(type + ':' + id);
  rerenderSxkdRow(type, id);
}

function saveSxkdEdit(type, id) {
  const { arr } = sxkdTypeMeta(type);
  const item = arr.find(d => d.id === id);
  if (!item) return;
  SXKD_FIELD_DEFS[type].forEach(f => {
    const el = document.getElementById(`sf_${type}_${id}_${f.key}`);
    if (!el) return;
    item[f.key] = f.type === 'number' ? (parseFloat(el.value) || null) : el.value.trim();
  });
  sxkdExpandedRows.delete(type + ':' + id);
  renderSxkd(); // re-render toàn bộ để cập nhật tổng nhóm + KPI
  saveSxkdData();
  sxkdToast('✓ Đã lưu thay đổi', false);
}

function deleteSxkdItem(type, id) {
  if (!confirm('Xóa hạng mục này?')) return;
  const { arr } = sxkdTypeMeta(type);
  const idx = arr.findIndex(d => d.id === id);
  if (idx > -1) arr.splice(idx, 1);
  renderSxkd();
  saveSxkdData();
  sxkdToast('🗑 Đã xóa hạng mục', true);
}

/* ═══════════════════════════════════════
   MODAL THÊM MỚI
   ═══════════════════════════════════════ */
function openAddSxkdItem(type) {
  sxkdModalType = type;
  const titleEl = document.getElementById('sxkdModalTitle');
  if (titleEl) titleEl.textContent = `Thêm hạng mục – ${SXKD_TYPE_LABEL[type] || ''}`;
  const body = document.getElementById('sxkdModalBody');
  if (body) {
    const defs = SXKD_FIELD_DEFS[type];
    body.innerHTML = `<div class="form-grid">${defs.map(f => `
      <div class="form-group ${f.span2 ? 'span2' : ''}">
        <label class="form-label">${f.label}</label>
        ${sxkdFieldInput(type, 'new', f, '')}
      </div>`).join('')}</div>`;
  }
  document.getElementById('sxkdModalOverlay')?.classList.add('open');
}

function closeSxkdModal() {
  document.getElementById('sxkdModalOverlay')?.classList.remove('open');
  sxkdModalType = null;
}

function saveSxkdModal() {
  const type = sxkdModalType;
  if (!type) return;
  const defs = SXKD_FIELD_DEFS[type];
  const requiredKey = type === 'doichieu' ? 'tsc' : 'title';
  const titleEl = document.getElementById(`sf_${type}_new_${requiredKey}`);
  if (!titleEl || !titleEl.value.trim()) {
    sxkdToast('⚠️ Vui lòng nhập nội dung đầu mục', true);
    return;
  }
  const newItem = { id: sxkdUid(type[0]) };
  defs.forEach(f => {
    const el = document.getElementById(`sf_${type}_new_${f.key}`);
    if (!el) return;
    newItem[f.key] = f.type === 'number' ? (parseFloat(el.value) || null) : el.value.trim();
  });
  const { arr } = sxkdTypeMeta(type);
  if (type === 'tscd' && !newItem.stt) newItem.stt = arr.length + 1;
  if (type === 'cphd' && !newItem.stt) newItem.stt = `7.${arr.length + 1}`;
  arr.push(newItem);
  closeSxkdModal();
  renderSxkd();
  saveSxkdData();
  sxkdToast('✓ Đã thêm hạng mục mới', false);
}

document.getElementById('sxkdModalOverlay')?.addEventListener('click', e => {
  if (e.target === e.currentTarget) closeSxkdModal();
});

/* ═══════════════════════════════════════
   KPI
   ═══════════════════════════════════════ */
function renderSxkdKpis() {
  const wrap = document.getElementById('sxkd-kpis');
  if (!wrap) return;
  const totalTscd = SXKD_TSCD.reduce((s, d) => s + (d.budget || 0), 0);
  const totalCphd = SXKD_CPHD.reduce((s, d) => s + (d.budget || 0), 0);
  wrap.innerHTML = `
    <div class="kpi k-amber"><div class="kpi-val">${totalTscd.toLocaleString('vi')}</div><div class="kpi-label">Mua sắm TSCĐ (${SXKD_TSCD.length} đầu mục) — Tr.đ</div></div>
    <div class="kpi k-green"><div class="kpi-val">${totalCphd.toLocaleString('vi')}</div><div class="kpi-label">Chi phí hoạt động (${SXKD_CPHD.length} đầu mục) — Tr.đ</div></div>
    <div class="kpi k-blue"><div class="kpi-val">0</div><div class="kpi-label">Đầu mục trùng hoàn toàn</div></div>
    <div class="kpi k-purple"><div class="kpi-val">${SXKD_DOICHIEU.length}</div><div class="kpi-label">Cần rà soát trùng lắp</div></div>
  `;
}

/* ═══════════════════════════════════════
   RENDER CHÍNH
   ═══════════════════════════════════════ */
function renderSxkdGroup(root, { type, catClass, icon, title, sourceNote }) {
  const { arr } = sxkdTypeMeta(type);
  const search = (document.getElementById('sxkd-search-input')?.value || '').toLowerCase();
  const items = arr.filter(it => {
    if (type === 'doichieu') return sxkdMatches(it.tsc, search) || sxkdMatches(it.cp, search) || sxkdMatches(it.note, search);
    return sxkdMatches(it.title, search) || sxkdMatches(it.note, search);
  });
  const total = type === 'doichieu' ? null : arr.reduce((s, d) => s + (d.budget || 0), 0);

  const sg = document.createElement('div');
  sg.className = 'sg';
  const metaTxt = type === 'doichieu' ? `${arr.length} cặp cần rà soát` : `${arr.length} hạng mục &nbsp;·&nbsp; ${total.toLocaleString('vi')} Tr.đ`;
  sg.innerHTML = `<div class="sg-header ${catClass}" onclick="this.parentElement.classList.toggle('collapsed')">
    <span class="sg-icon">${icon}</span><span class="sg-title">${title}</span>
    <span class="sg-meta">${metaTxt}</span><span class="sg-chevron">▾</span></div>`;

  const addBar = document.createElement('div');
  addBar.className = 'sg-add-bar';
  addBar.innerHTML = `<button class="btn-add-group" onclick="openAddSxkdItem('${type}')">➕ Thêm hạng mục</button>`;
  sg.appendChild(addBar);

  const body = document.createElement('div');
  body.className = 'sg-body';
  if (items.length === 0) {
    body.innerHTML = '<div class="empty-state"><div class="es-icon">📭</div><p>Không có hạng mục nào ' + (search ? 'khớp tìm kiếm' : 'trong nhóm này') + '.</p></div>';
  } else {
    const wrap = document.createElement('div');
    wrap.style.overflowX = 'auto';
    wrap.appendChild(buildSxkdTable(type, items));
    body.appendChild(wrap);
    if (sourceNote) body.innerHTML += `<div class="sg-footer">${sourceNote}</div>`;
  }
  sg.appendChild(body);
  root.appendChild(sg);
}

function renderSxkd() {
  renderSxkdKpis();
  const root = document.getElementById('sxkd-root');
  if (!root) return;
  root.innerHTML = '';

  if (!sxkdFilter || sxkdFilter === 'g1') {
    const total = SXKD_TSCD.reduce((s, d) => s + (d.budget || 0), 0);
    renderSxkdGroup(root, {
      type: 'tscd', catClass: 'cat-3', icon: '🛒',
      title: 'DANH MỤC MUA SẮM TSCĐ NĂM 2026 - CƠ QUAN TỔNG CÔNG TY (KHCNCĐS)',
      sourceNote: `Nguồn: 2026.01.23_Danh mục mua sắm TSCĐ năm 2026_Cty mẹ GE2.xlsx (Sheet "Co quan") · chỉ liệt kê đầu mục do <b>Ban KHCNCĐS</b> thụ lý · Tổng cộng: <b>${total.toLocaleString('vi')} Tr.đ</b>`,
    });
  }
  if (!sxkdFilter || sxkdFilter === 'g2') {
    const total = SXKD_CPHD.reduce((s, d) => s + (d.budget || 0), 0);
    renderSxkdGroup(root, {
      type: 'cphd', catClass: 'cat-2', icon: '🧾',
      title: 'KẾ HOẠCH CHI PHÍ HOẠT ĐỘNG NĂM 2026 - CƠ QUAN TỔNG CÔNG TY (KHCNCĐS)',
      sourceNote: `Nguồn: (2274-VP). KH chi phí hoạt động năm 2026_Cơ quan EVNGENCO2.xlsx (mục II.7 Chi phí CNTT) · chỉ liệt kê đầu mục đánh dấu <b>KHCNCĐS</b> · Tổng cộng: <b>${total.toLocaleString('vi')} Tr.đ</b>`,
    });
  }
  if (!sxkdFilter || sxkdFilter === 'g3') {
    renderSxkdGroup(root, {
      type: 'doichieu', catClass: 'cat-4', icon: '📊',
      title: 'ĐỐI CHIẾU ĐẦU MỤC - BAN KHCNCĐS (CƠ QUAN TCT)',
      sourceNote: `So sánh Danh mục mua sắm TSCĐ 2026 và Kế hoạch chi phí hoạt động 2026 (mục Chi phí CNTT) · Đầu mục trùng hoàn toàn: <b>0</b> · Chỉ có ở TSCĐ: <b>9</b> · Chỉ có ở Chi phí HĐ: <b>12</b>`,
    });
  }
}

function filterCatSxkd(btn, cat) {
  document.querySelectorAll('#page-sxkd .cf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  sxkdFilter = cat;
  renderSxkd();
}

function exportSxkdData() {
  const blob = new Blob([JSON.stringify({ tscd: SXKD_TSCD, cphd: SXKD_CPHD, doichieu: SXKD_DOICHIEU }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'KH_SXKD_2026_data.json';
  a.click();
  sxkdToast('📥 Đã xuất dữ liệu JSON', false);
}
