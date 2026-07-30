/* ═══ ĐỊNH HƯỚNG KHCN 2026 ═══ */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

const GROUPS = [
  { id:'g1', cat:'1', icon:'⚙️', color:'cat-1', title:'NHIỆM VỤ KHCN' },
  { id:'g2', cat:'2', icon:'🤖', color:'cat-2', title:'DỊCH VỤ KHCN' },
  { id:'g3', cat:'3', icon:'💡', color:'cat-3', title:'HOẠT ĐỘNG SÁNG KIẾN' },
  { id:'g4', cat:'4', icon:'📊', color:'cat-4', title:'CHI PHÍ QUẢN LÝ KHCN' },
];

let DATA = [
  // ── NHÓM 1 ──
  {id:'i1',  gid:'g1', pid:null, stt:'1',     lvl:0, title:'Nhiệm vụ KHCN', unit:'', budget:null, source:'', status:'new', note:''},
  {id:'i2',  gid:'g1', pid:'i1', stt:'1.1',   lvl:1, title:'Nhiệm vụ KHCN cấp EVNGENCO2', unit:'—', budget:null, source:'tbd', status:'new', note:''},
  {id:'i3',  gid:'g1', pid:'i1', stt:'1.2',   lvl:1, title:'Nhiệm vụ KHCN cấp cơ sở', unit:'Đơn vị', budget:null, source:'tbd', status:'new', note:''},
  {id:'i4',  gid:'g1', pid:'i3', stt:'1.2.1', lvl:2, title:'Nghiên cứu thiết kế lắp đặt hệ thống thu thập và giám sát áp suất khí SF6 máy cắt 110kV tại NMTĐQT', unit:'Cty Thuỷ điện Quảng Trị', budget:300, source:'khcn', status:'approved', note:'HĐQT thông qua chi phí để cơ sở thực hiện. Thanh toán theo giá trị thực tế.'},
  {id:'i5',  gid:'g1', pid:'i3', stt:'1.2.2', lvl:2, title:'Nghiên cứu xây dựng hệ thống camera thông minh dựa trên hạ tầng camera hiện hữu và ứng dụng trong công tác quản lý, vận hành nhà máy Thuỷ điện An Khê – Ka Nak', unit:'Cty Thuỷ điện An Khê – Ka Nak', budget:1500, source:'khcn', status:'approved', note:''},
  {id:'i6',  gid:'g1', pid:'i3', stt:'1.2.3', lvl:2, title:'Theo dõi tín hiệu âm thanh bất thường từ lò hơi và đường ống hơi để phát hiện rò rỉ hoặc đập hơi', unit:'Cty CP Nhiệt điện Hải Phòng', budget:null, source:'mixed', status:'new', note:''},
  {id:'i7',  gid:'g1', pid:'i3', stt:'1.2.4', lvl:2, title:'Nghiên cứu ứng dụng AI vào công tác quản lý đấu thầu, quản lý tiến độ thực hiện dự án', unit:'Cty CP Nhiệt điện Phả Lại', budget:null, source:'sxkd', status:'new', note:''},
  {id:'i8',  gid:'g1', pid:'i3', stt:'1.2.5', lvl:2, title:'Ứng dụng AI trong giám sát hệ thống đo đếm điện năng và giảm thiểu Qdu trong sản xuất điện tại Cty CPNĐ Phả Lại', unit:'Cty CP Nhiệt điện Phả Lại', budget:null, source:'sxkd', status:'transfer', note:'Nhiệm vụ chuyển tiếp'},
  {id:'i9',  gid:'g1', pid:'i3', stt:'1.2.6', lvl:2, title:'Nghiên cứu, ứng dụng giải pháp tìm kiếm và xử lý hiện tượng rò rỉ bình ngưng trong chu trình nhiệt tại DC2-PXVH', unit:'Cty CP Nhiệt điện Phả Lại', budget:null, source:'sxkd', status:'new', note:''},
  {id:'i10', gid:'g1', pid:'i3', stt:'1.2.7', lvl:2, title:'Nghiên cứu, phân tích và xử lý tình trạng hư hỏng vòng bi, cổ trục, gối trục của quạt khói dây chuyền 2 – Cty CP Nhiệt điện Phả Lại', unit:'Cty CP Nhiệt điện Phả Lại', budget:null, source:'sxkd', status:'new', note:''},
  {id:'i11', gid:'g1', pid:'i3', stt:'1.2.8', lvl:2, title:'Phần mềm tích hợp trí tuệ nhân tạo phục vụ giám sát, cảnh báo và dự báo mưa, thời tiết, lưu lượng khu vực hồ thuỷ điện A Vương', unit:'Cty CP Thuỷ điện A Vương', budget:null, source:'sxkd', status:'new', note:''},
  {id:'i12', gid:'g1', pid:'i3', stt:'1.2.9', lvl:2, title:'Ứng dụng AI dự báo công suất phát Nhà máy Điện mặt trời Thác Mơ', unit:'Cty CP Thuỷ điện Thác Mơ', budget:null, source:'mixed', status:'transfer', note:'Nhiệm vụ chuyển tiếp'},
  // ── NHÓM 2 ──
  {id:'i13', gid:'g2', pid:null, stt:'2',     lvl:0, title:'Dịch vụ KHCN', unit:'EVNGENCO2/Đơn vị', budget:null, source:'', status:'new', note:''},
  {id:'i14', gid:'g2', pid:'i13',stt:'2.1',   lvl:1, title:'Xây dựng và triển khai hệ thống AI hỗ trợ biên soạn văn bản, tài liệu quản lý tại EVNGENCO2', unit:'Ban KHCN&CĐS', budget:1000, source:'khcn', status:'approved', note:'HĐQT thông qua chi phí để Đơn vị có cơ sở thực hiện theo các quy định hiện hành.'},
  {id:'i15', gid:'g2', pid:'i13',stt:'2.2',   lvl:1, title:'Hệ thống AI Radar tri thức công nghệ', unit:'Ban KHCN&CĐS', budget:500, source:'khcn', status:'approved', note:''},
  {id:'i16', gid:'g2', pid:'i13',stt:'2.3',   lvl:1, title:'Hội nghị/Hội thảo về KHCN – ĐMST – CĐS trong EVN/EVNGENCO2', unit:'Ban KHCN&CĐS', budget:1000, source:'khcn', status:'approved', note:'Thanh toán theo giá trị thực tế.'},
  {id:'i17', gid:'g2', pid:'i13',stt:'2.4',   lvl:1, title:'Bồi dưỡng/tập huấn về triển khai xây dựng các ứng dụng KHCN, công nghệ số...', unit:'Ban KHCN&CĐS', budget:500, source:'khcn', status:'approved', note:''},
  {id:'i18', gid:'g2', pid:'i13',stt:'2.5',   lvl:1, title:'Ứng dụng chạy trên IOS và Android phần mềm phục vụ SXKD – Giai đoạn 2', unit:'Cty CP Thuỷ điện Thác Mơ', budget:null, source:'mixed', status:'transfer', note:'Hạng mục chuyển tiếp từ năm 2025 sang năm 2026.'},
  {id:'i19', gid:'g2', pid:'i13',stt:'2.6',   lvl:1, title:'Giám sát tấm pin và nhiệt độ mối nối dao cách ly đường dây 22kV bằng UAV tích hợp AI', unit:'Cty CP Thuỷ điện Thác Mơ', budget:null, source:'mixed', status:'new', note:'Đơn vị triển khai đảm bảo tuân thủ các quy định hiện hành.'},
  // ── NHÓM 3 ──
  {id:'i20', gid:'g3', pid:null, stt:'3',     lvl:0, title:'Hoạt động sáng kiến', unit:'EVNGENCO2/Đơn vị', budget:null, source:'', status:'new', note:''},
  {id:'i21', gid:'g3', pid:'i20',stt:'3.1',   lvl:1, title:'Cấp EVNGENCO2', unit:'Ban KHCN&CĐS / Ban TCKT', budget:3182, source:'khcn', status:'approved', note:'HĐQT thông qua chi phí để cơ sở thực hiện'},
  {id:'i22', gid:'g3', pid:'i21',stt:'3.1.1', lvl:2, title:'Dự kiến số sáng kiến cấp EVNGENCO2: 30 sáng kiến', unit:'Ban KHCN&CĐS / Ban TCKT', budget:3182, source:'khcn', status:'approved', note:'Thanh toán theo giá trị thực tế'},
  {id:'i23', gid:'g3', pid:'i20',stt:'3.2',   lvl:1, title:'Cấp cơ sở tại Cơ quan Tổng công ty và các đơn vị hạch toán phụ thuộc', unit:'Ban KHCN&CĐS / Ban TCKT', budget:1642, source:'khcn', status:'approved', note:'HĐQT thông qua chi phí để cơ sở thực hiện'},
  {id:'i24', gid:'g3', pid:'i23',stt:'3.2.1', lvl:2, title:'Dự kiến số sáng kiến cấp cơ sở tại Cơ quan EVNGENCO2 và các Đơn vị hạch toán phụ thuộc EVNGENCO2: 60 sáng kiến', unit:'Ban KHCN&CĐS / Ban TCKT', budget:1642, source:'khcn', status:'approved', note:'Thanh toán theo giá trị thực tế'},
  {id:'i25', gid:'g3', pid:'i20',stt:'3.3',   lvl:1, title:'Cấp cơ sở tại các Đơn vị Cổ phần và Công ty TNHH MTV', unit:'Đơn vị', budget:null, source:'mixed', status:'new', note:''},
  // ── NHÓM 4 ──
  {id:'i26', gid:'g4', pid:null, stt:'4',     lvl:0, title:'Chi phí dự kiến cho công tác quản lý hoạt động KHCN', unit:'—', budget:null, source:'', status:'new', note:''},
  {id:'i27', gid:'g4', pid:'i26',stt:'4.1',   lvl:1, title:'Chi phí dự kiến cho công tác quản lý hoạt động KHCN tại EVNGENCO2 và các Đơn vị HTPT năm 2026', unit:'Ban KHCN&CĐS / Ban TCKT', budget:500, source:'khcn', status:'approved', note:'HĐQT thông qua chi phí để cơ sở thực hiện'},
  {id:'i28', gid:'g4', pid:'i26',stt:'4.2',   lvl:1, title:'Chi phí dự kiến cho công tác quản lý hoạt động KHCN tại Đơn vị Cổ phần/Công ty TNHH MTV năm 2026', unit:'Đơn vị', budget:null, source:'mixed', status:'new', note:''},
];

let expandedRows = new Set();
let currentFilter = '';
let modalMode = null; // 'add-item' | 'add-group' | 'edit'
let editTarget = null;

// ═══════════════════════════════════════
// LƯU TRỮ TRÊN SERVER (file data/khcn-data.json — không dùng MySQL)
// GROUPS/DATA ở trên là dữ liệu mặc định (dùng khi chưa gọi được API, ví dụ mất mạng).
// Khi tải trang thành công, nội dung sẽ được nạp đè từ server để mọi người luôn thấy
// đúng bản mới nhất; sau mỗi lần thêm/sửa/xóa sẽ lưu ngược lại lên server.
// ═══════════════════════════════════════
async function loadKhcnData() {
  try {
    const r = await fetch('/api/khcn-data');
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Lỗi tải dữ liệu KHCN');
    if (Array.isArray(data.groups) && data.groups.length) { GROUPS.length = 0; GROUPS.push(...data.groups); }
    if (Array.isArray(data.items)) { DATA.length = 0; DATA.push(...data.items); }
  } catch (e) {
    console.warn('Không tải được dữ liệu KHCN từ server, đang dùng dữ liệu mặc định trong trình duyệt:', e.message);
  }
}

async function saveKhcnData() {
  try {
    const r = await fetch('/api/khcn-data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groups: GROUPS, items: DATA }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Lỗi lưu dữ liệu KHCN');
  } catch (e) {
    showToast('⚠️ Không lưu được lên server (' + e.message + '). Thay đổi có thể mất khi tải lại trang.', 'error');
  }
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function uid() { return 'i' + Date.now() + Math.random().toString(36).slice(2,6); }

function sourceBadge(s) {
  const map = {
    khcn:  ['badge-khcn','Quỹ KHCN EVNGENCO2'],
    sxkd:  ['badge-sxkd','SXKD Đơn vị'],
    mixed: ['badge-mixed','KHCN/SXKD'],
    tbd:   ['badge-mixed','Đơn vị xác định'],
  };
  if (!s || !map[s]) return '';
  const [cls,lbl] = map[s];
  return `<span class="row-badge ${cls}">${lbl}</span>`;
}

function statusTag(s) {
  const map = {
    transfer:   '🔄 Chuyển tiếp',
    approved:   '✅ HĐQT duyệt',
    inprogress: '🔵 Đang thực hiện',
    done:       '🟢 Hoàn thành',
    new:        '',
  };
  return map[s] || '';
}

// ═══════════════════════════════════════
// DASHBOARD KPI (cho lãnh đạo theo dõi nhanh)
// ═══════════════════════════════════════
function isLeafItem(item) {
  return !DATA.some(d => d.pid === item.id);
}

function renderKhcnKpis() {
  const wrap = document.getElementById('khcn-kpis');
  if (!wrap) return;

  const totalBudget = DATA.reduce((s, d) => s + (d.budget || 0), 0);
  const leaves = DATA.filter(isLeafItem);
  const approvedCount = leaves.filter(d => d.status === 'approved').length;
  const transferCount = leaves.filter(d => d.status === 'transfer').length;
  const tbdCount = leaves.filter(d => !d.budget).length;

  wrap.innerHTML = `
    <div class="kpi k-blue"><div class="kpi-val">${totalBudget.toLocaleString('vi')}</div><div class="kpi-label">Tổng kinh phí dự kiến 2026 — Tr.đ</div></div>
    <div class="kpi k-green"><div class="kpi-val">${approvedCount}</div><div class="kpi-label">Hạng mục đã HĐQT duyệt</div></div>
    <div class="kpi k-amber"><div class="kpi-val">${transferCount}</div><div class="kpi-label">Hạng mục chuyển tiếp</div></div>
    <div class="kpi k-purple"><div class="kpi-val">${tbdCount}</div><div class="kpi-label">Chưa xác định kinh phí</div></div>
  `;
}

// ═══════════════════════════════════════
// RENDER
// ═══════════════════════════════════════
function render() {
  renderKhcnKpis();
  const main = document.getElementById('khcn-root');
  const search = (document.getElementById('khcn-search-input')?.value || '').toLowerCase();
  main.innerHTML = '';

  GROUPS.forEach(g => {
    if (currentFilter !== '' && g.id !== currentFilter) return;

    const items = DATA.filter(d => d.gid === g.id);
    const totalBudget = items.reduce((s,d) => s + (d.budget||0), 0);
    const countDefined = items.filter(d=>d.budget).length;

    const sg = document.createElement('div');
    sg.className = 'sg';
    sg.id = 'sg_' + g.id;

    // header
    sg.innerHTML = `
      <div class="sg-header ${g.color}" onclick="toggleSg('${g.id}')">
        <span class="sg-icon">${g.icon}</span>
        <span class="sg-title">${esc(g.title)}</span>
        <span class="sg-meta">${items.length} hạng mục &nbsp;·&nbsp; ${totalBudget ? totalBudget.toLocaleString('vi') + ' Tr.đ' : 'KP chưa xác định'}</span>
        <span class="sg-chevron">▾</span>
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'sg-body';
    body.id = 'sgb_' + g.id;

    // Table với header cột + nút thêm
    const tableWrap = document.createElement('div');
    tableWrap.style.overflowX = 'auto';
    const table = document.createElement('table');
    table.className = 'khcn-table';

    // Header row
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr class="khcn-thead">
        <th class="khcn-th th-stt">STT</th>
        <th class="khcn-th th-title">Tên hoạt động</th>
        <th class="khcn-th th-unit">Đơn vị đề xuất</th>
        <th class="khcn-th th-budget">Kinh phí dự kiến<br><small style="font-weight:400;text-transform:none;letter-spacing:0">(Triệu đồng)</small></th>
        <th class="khcn-th th-source">Nguồn vốn</th>
        <th class="khcn-th th-status">Trạng thái</th>
        <th class="khcn-th th-note">Ghi chú</th>
        <th class="khcn-th th-actions"></th>
      </tr>`;
    table.appendChild(thead);

    // Rows
    const tbody = document.createElement('tbody');
    let matched = 0;
    items.forEach(item => {
      if (search && !item.title.toLowerCase().includes(search) && !(item.unit||'').toLowerCase().includes(search)) return;
      matched++;
      tbody.appendChild(buildRow(item, g));
    });
    table.appendChild(tbody);
    tableWrap.appendChild(table);
    body.appendChild(tableWrap);

    if (matched === 0) {
      body.innerHTML += `<div class="empty-state"><div class="es-icon">📭</div><p>Không có hạng mục nào ${search ? 'khớp tìm kiếm' : 'trong nhóm này'}.</p></div>`;
    }

    sg.appendChild(body);
    main.appendChild(sg);
  });
}

function buildRow(item, g) {
  const wrap = document.createElement('tr');
  wrap.className = `khcn-tr khcn-lvl-${item.lvl}`;
  wrap.id = 'row_' + item.id;

  const isExp = expandedRows.has(item.id);
  const indent = item.lvl * 18;
  const stClass = {new:'',transfer:'st-transfer',approved:'st-approved',inprogress:'st-inprogress',done:'st-done'}[item.status]||'';
  const stLabel = {new:'Mới',transfer:'Chuyển tiếp',approved:'HĐQT duyệt',inprogress:'Đang TH',done:'Hoàn thành'}[item.status]||'Mới';
  const srcMap  = {khcn:['badge-khcn','Quỹ KHCN EVNGENCO2'],sxkd:['badge-sxkd','SXKD Đơn vị'],mixed:['badge-mixed','KHCN/SXKD'],tbd:['','Đơn vị xác định']};
  const [srcCls,srcLbl] = srcMap[item.source]||['','—'];

  wrap.innerHTML = `
    <td class="khcn-td td-stt">${esc(item.stt)||''}</td>
    <td class="khcn-td td-title" onclick="toggleRow('${item.id}')">
      <div style="padding-left:${indent}px">
        <span class="khcn-title-text l${item.lvl}">${item.title?esc(item.title):'<em style="color:#94a3b8">Chưa có tên</em>'}</span>
      </div>
      <div class="edit-form-td ${isExp?'open':''}" id="ef_${item.id}" onclick="event.stopPropagation()">
        ${buildEditForm(item)}
      </div>
    </td>
    <td class="khcn-td td-unit">${esc(item.unit)||'—'}</td>
    <td class="khcn-td td-budget">${item.budget?`<span class="row-budget">${item.budget.toLocaleString('vi')} Tr.đ</span>`:'<span style="color:#94a3b8;font-size:12px">TBD</span>'}</td>
    <td class="khcn-td td-source">${item.source&&srcMap[item.source]?`<span class="row-badge ${srcCls}">${srcLbl}</span>`:'<span style="color:#94a3b8;font-size:12px">—</span>'}</td>
    <td class="khcn-td td-status"><span class="status-label ${stClass}">${stLabel}</span></td>
    <td class="khcn-td td-note" title="${esc(item.note)||''}">${item.note?`<span class="td-note-text">${esc(item.note)}</span>`:'<span style="color:#94a3b8">—</span>'}</td>
    <td class="khcn-td td-actions">
      <div style="display:flex;gap:3px;justify-content:center">
        <button class="act-btn" title="Thêm con" onclick="openAddItem('${item.gid}','${item.id}',${item.lvl+1})">＋</button>
        <button class="act-btn" title="Sửa" onclick="openEdit('${item.id}')">✏️</button>
        <button class="act-btn del" title="Xóa" onclick="deleteItem('${item.id}')">🗑</button>
      </div>
    </td>
  `;
  return wrap;
}


function buildEditForm(item) {
  const srcOpts = ['','khcn','sxkd','mixed','tbd'].map(v => {
    const lbl = {''  :'— Chọn nguồn vốn —', khcn:'Quỹ KHCN EVNGENCO2',
                  sxkd:'SXKD Đơn vị', mixed:'Quỹ KHCN / SXKD', tbd:'Đơn vị xác định'}[v];
    return `<option value="${v}" ${item.source===v?'selected':''}>${lbl}</option>`;
  }).join('');

  const stOpts = ['new','transfer','approved','inprogress','done'].map(v => {
    const lbl = {new:'Mới',transfer:'Chuyển tiếp',approved:'HĐQT đã duyệt',
                  inprogress:'Đang thực hiện',done:'Hoàn thành'}[v];
    return `<option value="${v}" ${item.status===v?'selected':''}>${lbl}</option>`;
  }).join('');

  return `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">STT</label>
        <input class="form-input" id="f_stt_${item.id}" value="${esc(item.stt)}">
      </div>
      <div class="form-group">
        <label class="form-label">Đơn vị đề xuất</label>
        <input class="form-input" id="f_unit_${item.id}" value="${esc(item.unit)}">
      </div>
      <div class="form-group span2">
        <label class="form-label">Tên hoạt động</label>
        <textarea class="form-textarea" id="f_title_${item.id}">${esc(item.title)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Kinh phí (Triệu đồng)</label>
        <input class="form-input" type="number" id="f_budget_${item.id}" value="${item.budget||''}">
      </div>
      <div class="form-group">
        <label class="form-label">Nguồn vốn</label>
        <select class="form-select" id="f_source_${item.id}">${srcOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Trạng thái</label>
        <select class="form-select" id="f_status_${item.id}">${stOpts}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Ghi chú</label>
        <input class="form-input" id="f_note_${item.id}" value="${esc(item.note)||''}">
      </div>
    </div>
    <div class="form-row-actions">
      <button class="btn-cancel" onclick="cancelEdit('${item.id}')">Hủy</button>
      <button class="btn-save" onclick="saveEdit('${item.id}')">✓ Lưu thay đổi</button>
    </div>
  `;
}

// ═══════════════════════════════════════
// INTERACTIONS
// ═══════════════════════════════════════
function toggleSg(gid) {
  document.getElementById('sg_'+gid)?.classList.toggle('collapsed');
}

function toggleRow(id) {
  if (expandedRows.has(id)) expandedRows.delete(id);
  else expandedRows.add(id);
  // refresh just this row
  const item = DATA.find(d=>d.id===id);
  const g = GROUPS.find(g=>g.id===item.gid);
  const oldWrap = document.getElementById('row_'+id);
  const newWrap = buildRow(item, g);
  // newWrap là <tr>, replaceWith hoạt động trong tbody
  oldWrap.replaceWith(newWrap);
}

function openEdit(id) {
  if (!expandedRows.has(id)) {
    expandedRows.add(id);
    const item = DATA.find(d=>d.id===id);
    const g = GROUPS.find(g=>g.id===item.gid);
    document.getElementById('row_'+id).replaceWith(buildRow(item,g));
  }
}

function cancelEdit(id) {
  expandedRows.delete(id);
  const item = DATA.find(d=>d.id===id);
  const g = GROUPS.find(g=>g.id===item.gid);
  document.getElementById('row_'+id).replaceWith(buildRow(item,g));
}

function saveEdit(id) {
  const item = DATA.find(d=>d.id===id);
  if (!item) return;
  item.stt    = document.getElementById('f_stt_'+id).value.trim();
  item.title  = document.getElementById('f_title_'+id).value.trim();
  item.unit   = document.getElementById('f_unit_'+id).value.trim();
  item.budget = parseFloat(document.getElementById('f_budget_'+id).value) || null;
  item.source = document.getElementById('f_source_'+id).value;
  item.status = document.getElementById('f_status_'+id).value;
  item.note   = document.getElementById('f_note_'+id).value.trim();
  expandedRows.delete(id);
  const g = GROUPS.find(g=>g.id===item.gid);
  document.getElementById('row_'+id).replaceWith(buildRow(item,g));
  renderKhcnKpis();
  saveKhcnData();
  showToast('✓ Đã lưu thay đổi', 'success');
}

function deleteItem(id) {
  if (!confirm('Xóa hạng mục này?')) return;
  DATA = DATA.filter(d => d.id !== id && d.pid !== id);
  render();
  saveKhcnData();
  showToast('🗑 Đã xóa hạng mục', 'error');
}

// ── MODAL ──
function openAddItem(gid, pid, lvl) {
  modalMode = 'add-item';
  editTarget = { gid, pid, lvl };
  document.getElementById('modalTitle').textContent = `Thêm hạng mục cấp ${lvl} – ${GROUPS.find(g=>g.id===gid)?.title}`;
  clearModal();
  // populate parent select
  const sel = document.getElementById('m_parent');
  sel.innerHTML = '<option value="">— Không có cha (gốc nhóm) —</option>';
  DATA.filter(d=>d.gid===gid && d.lvl < 2).forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.id; opt.textContent = `${d.stt} – ${d.title.slice(0,40)}`;
    if (d.id === pid) opt.selected = true;
    sel.appendChild(opt);
  });
  document.getElementById('modalOverlay').classList.add('open');
}

function openAddGroup() {
  modalMode = 'add-group';
  document.getElementById('modalTitle').textContent = 'Thêm nhóm hoạt động mới';
  clearModal();
  document.getElementById('modalOverlay').classList.add('open');
}

function clearModal() {
  ['m_stt','m_title','m_unit','m_budget','m_note'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('m_source').value = '';
  document.getElementById('m_status').value = 'new';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function saveModal() {
  const title = document.getElementById('m_title').value.trim();
  if (!title) { showToast('⚠️ Vui lòng nhập tên hoạt động', 'error'); return; }

  if (modalMode === 'add-group') {
    const gid = 'g' + uid();
    GROUPS.push({ id:gid, cat: String(GROUPS.length+1), icon:'📁', color:'cat-1', title: title.toUpperCase() });
    closeModal(); render();
    saveKhcnData();
    showToast('✓ Đã thêm nhóm mới', 'success');
    return;
  }

  const { gid, lvl } = editTarget;
  const pid = document.getElementById('m_parent').value || null;
  const newItem = {
    id: uid(), gid, pid,
    stt:    document.getElementById('m_stt').value.trim(),
    lvl:    lvl || 1,
    title,
    unit:   document.getElementById('m_unit').value.trim(),
    budget: parseFloat(document.getElementById('m_budget').value) || null,
    source: document.getElementById('m_source').value,
    status: document.getElementById('m_status').value,
    note:   document.getElementById('m_note').value.trim(),
  };
  DATA.push(newItem);
  closeModal(); render();
  saveKhcnData();
  showToast('✓ Đã thêm hạng mục mới', 'success');
}

// ── FILTER ──
function filterCat(btn, cat) {
  document.querySelectorAll('.cf-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = cat; render();
}

function filterRows() { render(); }

// ── EXPORT ──
function exportKhcnData() {
  const blob = new Blob([JSON.stringify({groups:GROUPS, items:DATA}, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'KHCN_2026_data.json';
  a.click();
  showToast('📥 Đã xuất dữ liệu JSON', 'success');
}

// ── TOAST ──
function showToast(msg, type='') {
  if(typeof toast === 'function') toast(msg, type==='error');
}

// ── CLOSE MODAL ON OVERLAY CLICK ──
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ── INIT ──
// Vẽ ngay bằng dữ liệu mặc định (không phải chờ mạng), rồi nạp đè dữ liệu thật từ server.
render();
loadKhcnData().then(render);