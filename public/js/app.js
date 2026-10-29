'use strict';

/* ═══ CONSTANTS ═══ */
const STATUS = {
  chua_bat_dau:  { label:'Chưa bắt đầu', pill:'p-gray',  color:'#94a3b8' },
  dang_thuc_hien:{ label:'Đang thực hiện',pill:'p-blue',  color:'#3b82f6' },
  hoan_thanh:    { label:'Hoàn thành',    pill:'p-green', color:'#10b981' },
  cham_tien_do:  { label:'Chậm tiến độ', pill:'p-amber', color:'#f59e0b' },
  qua_han:       { label:'Quá hạn',       pill:'p-red',   color:'#ef4444' },
  tam_dung:      { label:'Tạm dừng',      pill:'p-gray',  color:'#cbd5e1' },
};
const PROJ_COLORS = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4','#ec4899','#f97316'];

/* ═══ HELPERS ═══ */
const $ = id => document.getElementById(id);
/* esc() được định nghĩa ở khcn.js (nạp trước app.js trong index.html) — dùng chung. */
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtDateTime = d => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('vi-VN')+' '+dt.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
};
const fmtMoney = v => {
  if (!v) return '0';
  if (v >= 1e9) return (v/1e9).toFixed(1)+' tỷ';
  if (v >= 1e6) return Math.round(v/1e6)+' tr';
  return v.toLocaleString('vi-VN');
};
const pColor = p => p>=80?'#10b981':p>=50?'#3b82f6':p>=20?'#f59e0b':'#ef4444';

function toast(msg, err=false) {
  const el=$('toast');
  el.textContent=(err?'❌ ':'✅ ')+msg;
  el.className='toast show'+(err?' err':'');
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('show'),3000);
}

async function api(path, opts={}) {
  const r = await fetch('/api'+path,{
    headers:{'Content-Type':'application/json'},
    ...opts,
    body:opts.body?JSON.stringify(opts.body):undefined,
  });
  const data = await r.json();
  if (!r.ok) {
    if (r.status===401 && typeof handleUnauthorized==='function') handleUnauthorized();
    throw new Error(data.error||'Lỗi server');
  }
  return data;
}

/* ═══ CLOCK ═══ */
function startClock() {
  const el=$('nav-clock');
  const tick=()=>{
    const n=new Date();
    el.textContent=n.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'})
      +'  '+n.toLocaleTimeString('vi-VN');
  };
  tick(); setInterval(tick,1000);
}

/* ═══ STATE ═══ */
let projects=[], dashTimer=null, dashCountdown=60, activeTabId=null, editingProjId=null;

/* ═══ NAV ═══ */
document.querySelectorAll('.sidebar-link[data-page]').forEach(el=>{
  el.addEventListener('click',e=>{
    e.preventDefault();
    showPage(el.dataset.page);
  });
});

function showPage(name){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));
  const pageEl=$('page-'+name);
  if(pageEl) pageEl.classList.add('active');
  const navEl=document.querySelector(`.sidebar-link[data-page="${name}"]`);
  if(navEl) navEl.classList.add('active');
  if(name==='dashboard'){
    startDashboard();
  }
  else if(name==='lich-su'){
    clearInterval(dashTimer);
    loadArchives();
  }
  else if(name==='nhap-lieu'){
    clearInterval(dashTimer);
    loadProjects().then(()=>{renderProjManageList();loadItems();});
  }
  else if(name==='khcn'){
    clearInterval(dashTimer);
    // Nạp lại dữ liệu mới nhất từ server mỗi lần mở tab (để thấy thay đổi của người khác)
    if(typeof loadKhcnData==='function'){
      loadKhcnData().then(()=>{ if(typeof render==='function') render(); });
    } else if(typeof render==='function') render();
  }
  else if(name==='sxkd'){
    clearInterval(dashTimer);
    if(typeof loadSxkdData==='function'){
      loadSxkdData().then(()=>{ if(typeof renderSxkd==='function') renderSxkd(); });
    } else if(typeof renderSxkd==='function') renderSxkd();
  }
  else if(name==='nguoi-dung'){
    clearInterval(dashTimer);
    if(typeof loadUsersAndAudit==='function') loadUsersAndAudit();
  }
  else if(name==='ho-so'){
    clearInterval(dashTimer);
    if(typeof loadProfile==='function') loadProfile();
  }
}

/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */
function startDashboard(){
  loadDashboard();
  startRefreshTimer();
}

function startRefreshTimer(){
  clearInterval(dashTimer); dashCountdown=60;
  dashTimer=setInterval(()=>{
    dashCountdown--;
    if($('db-refresh-info2')) $('db-refresh-info2').textContent=`Tự làm mới sau ${dashCountdown}s`;
    if(dashCountdown<=0){ loadDashboard(); dashCountdown=60; }
  },1000);
}


async function loadDashboard(){
  const d=await api('/stats');
  projects=d.projects;
  // Gắn tình hình mới nhất vào từng project từ allItems
  const thMap={};
  (d.allItems||[]).forEach(i=>{ if(i.tinh_hinh_moi){ if(!thMap[i.project_id]||new Date(i.tinh_hinh_moi.created_at)>new Date(thMap[i.project_id].created_at)) thMap[i.project_id]=i.tinh_hinh_moi; } });
  const projsWithTH = d.projects.map(p=>({...p, tinh_hinh_moi: thMap[p.id]||null}));
  $('db-subtitle').textContent='Cập nhật lúc '+new Date().toLocaleString('vi-VN');
  renderKPIs(d);
  renderDonut(d.byStatus,d.totals.total||1);
  renderAlerts(d.projects,d.recent);
  renderProjCards(projsWithTH);
  // Sync dropdown dự án trong dashboard
  const dbProjSel=$('db-proj-filter');
  if(dbProjSel){ const v=dbProjSel.value; dbProjSel.innerHTML='<option value="">Tất cả dự án</option>'+d.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join(''); dbProjSel.value=v; }
  renderProjTabs(d.projects,d.allItems||d.recent);
}

function renderKPIs(d){
  const t=d.totals;
  const onTime=d.projects.filter(p=>p.overdue===0&&p.slow===0).length;
  const inProg=Math.max(0,(t.total||0)-(t.done||0)-(t.problem||0));
  $('db-kpis').innerHTML = [
    { val: onTime,       of: d.projects.length, label: 'Dự án đúng tiến độ', color: '#fff' },
    { val: t.done||0,    of: t.total||0,        label: 'Hoàn thành',         color: '#6ee7b7' },
    { val: inProg,       of: t.total||0,        label: 'Đang TH',            color: '#93c5fd' },
    { val: t.problem||0, of: t.total||0,        label: 'Chậm / Quá hạn',     color: '#fca5a5' },
  ].map(k=>`<div class="pdh-kpi">
    <div class="pdh-kpi-val" style="color:${k.color}">${k.val}<span style="font-size:16px;opacity:.6">/${k.of}</span></div>
    <div class="pdh-kpi-label">${k.label}</div>
  </div>`).join('');
}

function renderDonut(byStatus,total){
  const ORDER=['hoan_thanh','dang_thuc_hien','cham_tien_do','qua_han','chua_bat_dau','tam_dung'];
  const map={}; byStatus.forEach(s=>map[s.status]=s.c);
  const data=ORDER.map(k=>({key:k,label:STATUS[k]?.label||k,color:STATUS[k]?.color||'#ccc',val:map[k]||0})).filter(d=>d.val>0);
  const canvas=$('donut-chart'), ctx=canvas.getContext('2d');
  const cx=150,cy=150,R=132,hole=84,gap=0.025;
  ctx.clearRect(0,0,300,300);
  let angle=-Math.PI/2;
  data.forEach(d=>{
    const slice=(d.val/total)*Math.PI*2-gap;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.arc(cx,cy,R,angle+gap/2,angle+gap/2+slice);
    ctx.closePath(); ctx.fillStyle=d.color; ctx.fill();
    angle+=(d.val/total)*Math.PI*2;
  });
  ctx.beginPath(); ctx.arc(cx,cy,hole,0,Math.PI*2);
  ctx.fillStyle='#fff'; ctx.fill();
  const done=map['hoan_thanh']||0, pct=Math.round(done/total*100);
  ctx.fillStyle='#0f172a';
  ctx.font='bold 38px Segoe UI,system-ui,sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(pct+'%',cx,cy-10);
  ctx.fillStyle='#64748b';
  ctx.font='14px Segoe UI,system-ui,sans-serif';
  ctx.fillText('hoàn thành',cx,cy+18);
  $('donut-legend').innerHTML=data.map(d=>{
    const p=Math.round(d.val/total*100);
    return `<div class="legend-item">
      <div class="legend-dot" style="background:${d.color}"></div>
      <div class="legend-label">${d.label}</div>
      <div class="legend-val">${d.val}</div>
      <div class="legend-pct">${p}%</div>
    </div>`;
  }).join('');
}

function renderAlerts(projs,recent){
  const alerts=[];
  projs.forEach(p=>{
    if(p.overdue>0) alerts.push({cls:'a-red',icon:'🔴',title:esc(p.name),sub:`${p.overdue} hạng mục quá hạn`,pid:p.id});
    else if((p.slow||0)>0) alerts.push({cls:'a-amber',icon:'⚠️',title:esc(p.name),sub:`${p.slow} hạng mục chậm tiến độ`,pid:p.id});
  });
  const soon=recent.filter(i=>{
    if(!i.end_date||i.status==='hoan_thanh') return false;
    const days=Math.ceil((new Date(i.end_date)-new Date())/86400000);
    return days>=0&&days<=7;
  });
  if(soon.length>0){
    const soonPids=[...new Set(soon.map(i=>i.project_id))];
    alerts.push({cls:'a-amber',icon:'📅',title:`${soon.length} hạng mục sắp đến hạn`,sub:'Trong vòng 7 ngày tới',pid:soonPids.length===1?soonPids[0]:null});
  }
  if(!alerts.length) alerts.push({cls:'a-green',icon:'✅',title:'Không có vấn đề cần chú ý',sub:'Tất cả dự án đang trong kiểm soát'});
  $('alert-list').innerHTML=alerts.map(a=>`
    <div class="alert-item ${a.cls}${a.pid?' clickable':''}"${a.pid?` onclick="loadProjectDetail(${a.pid})" title="Xem chi tiết dự án"`:''}>
      <div class="alert-icon">${a.icon}</div>
      <div><div class="alert-title">${a.title}</div><div class="alert-sub">${a.sub}</div></div>
    </div>`).join('');
}

function renderProjCards(projs){
  $('proj-cards').innerHTML=projs.map((p,i)=>{
    const pct=p.progress||0;
    const col=PROJ_COLORS[i%PROJ_COLORS.length];
    const inPrg=Math.max(0,p.total-p.done-(p.overdue||0)-(p.slow||0));
    const st=p.overdue>0?{cls:'p-red',label:'Có vấn đề'}:pct===100?{cls:'p-green',label:'Hoàn thành'}:pct>=60?{cls:'p-blue',label:'Đúng tiến độ'}:{cls:'p-amber',label:'Cần theo dõi'};
    // Thời hạn còn lại
    let deadline='';
    if(p.end_date){
      const days=Math.ceil((new Date(p.end_date)-new Date())/86400000);
      deadline=days>0?`Còn ${days} ngày`:(days===0?'Đến hạn hôm nay':`Quá hạn ${Math.abs(days)} ngày`);
    }
    return `<div class="pcard${activeTabId===p.id?' selected':''}" style="--pc:${col};cursor:pointer" onclick="loadProjectDetail(${p.id})">
      <div class="pcard-top">
        <div class="pcard-badge" style="background:${col}18;color:${col}">
          <span style="width:8px;height:8px;border-radius:50%;background:${col};display:inline-block"></span>
          ${p.code||'DA'}
        </div>
        <div class="pcard-name">${esc(p.name)}</div>
        <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <span class="pill ${st.cls}">${st.label}</span>
          ${deadline?`<span style="font-size:12px;color:#64748b">${deadline}</span>`:''}
        </div>
      </div>
      <div class="pcard-body">
        <div class="pcard-stats">
          <div class="pstat ps-green"><div class="pstat-val">${p.done}</div><div class="pstat-label">Hoàn thành</div></div>
          <div class="pstat ps-amber"><div class="pstat-val">${inPrg}</div><div class="pstat-label">Đang TH</div></div>
          <div class="pstat ps-red"><div class="pstat-val">${p.overdue||0}</div><div class="pstat-label">Quá hạn</div></div>
        </div>
        <div class="pcard-prog-label">
          <span>Tiến độ (theo thời lượng HM)</span><b>${pct}%</b>
        </div>
        <div class="pbar"><div class="pbar-fill" style="width:${pct}%;background:linear-gradient(90deg,${col},${col}aa)"></div></div>
      </div>
      <div class="pcard-foot">
        <span>${p.start_date?fmtDate(p.start_date):'—'} → ${p.end_date?fmtDate(p.end_date):'—'}</span>
        <span class="pct-label" style="color:${col}">${pct}%</span>
      </div>
      ${p.tinh_hinh_moi?`<div class="pcard-tinh-hinh">
        <div class="pcard-th-label">📝 Tình hình mới nhất</div>
        <div class="pcard-th-text">${esc(p.tinh_hinh_moi.noi_dung)}</div>
        <div class="pcard-th-time">${fmtDateTime(p.tinh_hinh_moi.created_at)}</div>
      </div>`:''}
    </div>`;
  }).join('')||'<div style="color:#94a3b8;padding:20px">Chưa có dự án nào.</div>';
}

function selectProjCard(pid,col,el){
  activeTabId=pid;
  document.querySelectorAll('.pcard').forEach(c=>c.classList.remove('selected'));
  el.classList.add('selected');
  switchTab(pid,col);
  setTimeout(()=>{ const t=$('proj-detail-tabs'); if(t) t.scrollIntoView({behavior:'smooth',block:'nearest'}); },100);
}

function renderProjTabs(projs,allItems){
  if(!projs.length){ $('proj-detail-tabs').innerHTML=''; $('proj-detail-panels').innerHTML=''; return; }
  if(!activeTabId||!projs.find(p=>p.id===activeTabId)) activeTabId=projs[0].id;
  $('proj-detail-tabs').innerHTML=projs.map((p,i)=>{
    const col=PROJ_COLORS[i%PROJ_COLORS.length];
    const active=p.id===activeTabId;
    return `<div class="ptab${active?' active':''}" data-pid="${p.id}" data-col="${col}"
      style="${active?`border-top:3px solid ${col};color:${col}`:''}"
      onclick="switchTab(${p.id},'${col}')">
      ${esc(p.name)}
      ${p.overdue>0?`<span class="pill p-red" style="font-size:10px;padding:2px 8px">${p.overdue}</span>`:''}
    </div>`;
  }).join('');
  _allDashItems=allItems; // lưu để dùng cho phân trang
  $('proj-detail-panels').innerHTML=projs.map(p=>{
    const items=allItems.filter(i=>i.project_id===p.id).sort((a,b)=>new Date(a.start_date||0)-new Date(b.start_date||0));
    return `<div class="ppanel${p.id===activeTabId?' active':''}" id="panel-${p.id}">${buildItemTable(items,p.id,1)}</div>`;
  }).join('');
}

function switchTab(pid,col){
  activeTabId=pid;
  document.querySelectorAll('.ptab').forEach(t=>{
    const active=parseInt(t.dataset.pid)===pid;
    t.classList.toggle('active',active);
    t.style.borderTop=active?`3px solid ${col}`:'';
    t.style.color=active?col:'';
  });
  document.querySelectorAll('.ppanel').forEach(p=>p.classList.remove('active'));
  const panel=$('panel-'+pid); if(panel) panel.classList.add('active');
}

function deadlineNote(item){
  if(!item.end_date) return {text:'—',cls:'',style:'color:#94a3b8'};
  const today=new Date(); today.setHours(0,0,0,0);
  const end=new Date(item.end_date);
  const diffDays=Math.ceil((end-today)/86400000); // dương = còn, âm = đã qua

  if(item.status==='hoan_thanh'){
    // Ưu tiên dùng done_date (ngày HT thực tế), fallback updated_at
    const doneStr = item.done_date || item.updated_at;
    const done = new Date(doneStr); done.setHours(0,0,0,0);
    const lateDays = Math.ceil((done-end)/86400000);
    if(lateDays>0) return {text:`Trễ ${lateDays} ngày`,style:'color:#991b1b;font-weight:700;background:#fee2e2;padding:3px 10px;border-radius:20px;font-size:12px'};
    if(lateDays<0) return {text:`Trước ${Math.abs(lateDays)} ngày ✓`,style:'color:#065f46;font-weight:700;background:#d1fae5;padding:3px 10px;border-radius:20px;font-size:12px'};
    return {text:'Đúng hạn ✓',style:'color:#065f46;font-weight:700;background:#d1fae5;padding:3px 10px;border-radius:20px;font-size:12px'};
  }

  if(item.status==='qua_han'||diffDays<0){
    const over=Math.abs(diffDays);
    return {text:`Quá hạn ${over} ngày`,style:'color:#991b1b;font-weight:700;background:#fee2e2;padding:3px 10px;border-radius:20px;font-size:12px'};
  }
  if(diffDays===0) return {text:'Đến hạn hôm nay!',style:'color:#92400e;font-weight:700;background:#fef3c7;padding:3px 10px;border-radius:20px;font-size:12px'};
  if(diffDays<=7)  return {text:`Còn ${diffDays} ngày`,style:'color:#92400e;font-weight:600;background:#fef3c7;padding:3px 10px;border-radius:20px;font-size:12px'};
  if(diffDays<=14) return {text:`Còn ${diffDays} ngày`,style:'color:#1d4ed8;font-weight:500;background:#dbeafe;padding:3px 10px;border-radius:20px;font-size:12px'};
  return {text:`Còn ${diffDays} ngày`,style:'color:#475569;font-size:12px'};
}

/* State phân trang theo panel */
const _pageState={};
/* State filter dashboard */
let _dbFilter={ proj:'', status:'', search:'' };

function onDbFilter(){
  _dbFilter.proj   = $('db-proj-filter')?.value||'';
  _dbFilter.status = $('db-status-filter')?.value||'';
  _dbFilter.search = $('db-search')?.value?.toLowerCase()||'';
  applyDbFilter();
}
function onDbSearchKey(e){ if(e.key==='Enter'||!e.target.value) onDbFilter(); }
function clearDbFilter(){
  _dbFilter={proj:'',status:'',search:''};
  if($('db-proj-filter'))   $('db-proj-filter').value='';
  if($('db-status-filter')) $('db-status-filter').value='';
  if($('db-search'))        $('db-search').value='';
  applyDbFilter();
}

function applyDbFilter(){
  // Lọc allItems theo filter
  const filtered = _allDashItems.filter(i=>{
    if(_dbFilter.proj   && i.project_id!==parseInt(_dbFilter.proj))   return false;
    if(_dbFilter.status && i.status!==_dbFilter.status)                return false;
    if(_dbFilter.search && !i.name.toLowerCase().includes(_dbFilter.search)
       && !(i.assignee||'').toLowerCase().includes(_dbFilter.search)
       && !(i.group_name||'').toLowerCase().includes(_dbFilter.search)) return false;
    return true;
  });

  // Nếu lọc theo dự án cụ thể → chuyển tab
  if(_dbFilter.proj){
    const pid=parseInt(_dbFilter.proj);
    const proj=projects.find(p=>p.id===pid);
    if(proj){
      const col=PROJ_COLORS[projects.indexOf(proj)%PROJ_COLORS.length];
      switchTab(pid,col);
    }
  }

  // Re-render panels với data đã lọc
  // Group filtered items theo project
  projects.forEach(p=>{
    const panel=$('panel-'+p.id); if(!panel) return;
    const pItems = filtered.filter(i=>i.project_id===p.id).sort((a,b)=>new Date(a.start_date||0)-new Date(b.start_date||0));
    panel.innerHTML = buildItemTable(pItems, p.id, 1);
  });

  // Hiện kết quả tìm kiếm
  const total=filtered.length;
  const el=$('db-refresh-info2');
  if(el) el.textContent = _dbFilter.proj||_dbFilter.status||_dbFilter.search
    ? `Đang lọc: ${total} hạng mục`
    : `Tự làm mới sau ${dashCountdown}s`;
}

function buildItemTable(items, pid, page=1){
  if(!items.length) return `<div class="tbl-empty">Chưa có hạng mục nào trong dự án này.</div>`;
  const PER=10;
  const totalPages=Math.ceil(items.length/PER);
  page=Math.max(1,Math.min(page,totalPages));
  _pageState[pid]=page;
  const pageItems=items.slice((page-1)*PER, page*PER);

  const rows=pageItems.map(i=>{
    const s=STATUS[i.status]||{label:i.status,pill:'p-gray'};
    const note=deadlineNote(i);
    let duration='—';
    if(i.start_date&&i.end_date){
      const days=Math.ceil((new Date(i.end_date)-new Date(i.start_date))/86400000);
      duration=days+' ngày';
    }
    const th=i.tinh_hinh_moi;
    return `<tr class="item-row" onclick="toggleItemDetailView(${i.id},${pid},this)" style="cursor:pointer">
      <td>
        <div class="tbl-name">${esc(i.name)}</div>
        ${i.group_name?`<div class="tbl-sub">${esc(i.group_name)}</div>`:''}
      </td>
      <td><span class="pill ${s.pill}">${s.label}</span></td>
      <td style="color:#475569">${duration}</td>
      <td style="color:#475569">${fmtDate(i.start_date)}</td>
      <td style="color:#64748b">${fmtDate(i.end_date)}</td>
      <td style="color:#475569">${esc(i.assignee)||'—'}</td>
      <td>${th?`<span class="th-preview">${esc(th.noi_dung.substring(0,40))}${th.noi_dung.length>40?'…':''}</span>`:'<span style="color:#94a3b8;font-size:12px">Chưa có</span>'}</td>
      <td><span style="${note.style}">${note.text}</span></td>
    </tr>
    <tr class="item-detail-row" id="db-detail-${i.id}" style="display:none">
      <td colspan="8" style="padding:0;background:#f8fafc;border-bottom:2px solid #e2e8f0">
        <div class="item-detail-inner" id="db-detail-content-${i.id}">
          <div style="padding:20px;text-align:center;color:#94a3b8">Đang tải...</div>
        </div>
      </td>
    </tr>`;
  }).join('');

  const pagination = totalPages>1 ? `<div class="pagination">
    <button class="pg-btn" onclick="gotoPage(${pid},${page-1})" ${page<=1?'disabled':''}>‹ Trước</button>
    ${Array.from({length:totalPages},(_,i)=>i+1).map(pg=>`
      <button class="pg-btn${pg===page?' active':''}" onclick="gotoPage(${pid},${pg})">${pg}</button>
    `).join('')}
    <button class="pg-btn" onclick="gotoPage(${pid},${page+1})" ${page>=totalPages?'disabled':''}>Sau ›</button>
    <span class="pg-info">Trang ${page}/${totalPages} · ${items.length} hạng mục</span>
  </div>` : `<div class="pg-info" style="padding:10px 18px;font-size:13px;color:#94a3b8">${items.length} hạng mục</div>`;

  return `<div class="table-wrap"><table class="tbl">
    <thead><tr>
      <th>Hạng mục</th><th>Trạng thái</th><th>Thời lượng</th>
      <th>Ngày bắt đầu</th><th>Hạn hoàn thành</th><th>Người phụ trách</th>
      <th>Tình hình gần đây</th><th>Tình trạng thời hạn</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table></div>${pagination}`;
}

/* ── Phân trang ── */
let _allDashItems=[];
function gotoPage(pid,page){
  const items=_allDashItems.filter(i=>i.project_id===pid).sort((a,b)=>new Date(a.start_date||0)-new Date(b.start_date||0));
  const panel=$('panel-'+pid);
  if(panel) panel.innerHTML=buildItemTable(items,pid,page);
}

async function toggleItemDetailView(itemId, pid, rowEl){
  const detailRow=$('db-detail-'+itemId);
  const content  =$('db-detail-content-'+itemId);
  if(!detailRow) return;
  const isOpen = detailRow.style.display!=='none';
  // Đóng tất cả
  document.querySelectorAll('.item-detail-row').forEach(r=>r.style.display='none');
  document.querySelectorAll('.item-row').forEach(r=>r.classList.remove('row-active'));
  if(isOpen) return;
  detailRow.style.display='';
  rowEl.classList.add('row-active');
  // Load lịch sử — chỉ xem
  content.innerHTML='<div style="padding:16px 20px;text-align:center;color:#94a3b8">Đang tải...</div>';
  try{
    const logs = await api('/items/'+itemId+'/tinh-hinh');
    content.innerHTML=`<div class="item-detail-inner">
      <div class="item-detail-header">
        <span style="font-size:14px;font-weight:700;color:#0f172a">📋 Lịch sử tình hình triển khai</span>
        <button class="btn-primary btn-sm" onclick="loadProjectDetail(${pid})" title="Vào trang chi tiết để thêm cập nhật">
          ✏️ Vào chi tiết để nhập
        </button>
      </div>
      ${logs.length ? logs.map(l=>`
        <div class="th-log-item">
          <div class="th-log-dot"></div>
          <div class="th-log-body">
            ${l.noi_dung?`<div class="th-log-text">${esc(l.noi_dung)}</div>`:''}
            ${thFilesHTML(l.files)}
            <div class="th-log-meta"><span>${fmtDateTime(l.created_at)}</span></div>
          </div>
        </div>`).join('')
      : '<div style="padding:16px 20px;color:#94a3b8;font-size:13px">Chưa có cập nhật nào. Vào trang chi tiết dự án để thêm.</div>'}
    </div>`;
  } catch(e){
    content.innerHTML='<div style="padding:16px;color:#dc2626">Lỗi tải dữ liệu</div>';
  }
}

/* ── Toggle chi tiết + lịch sử tình hình ── */
async function toggleItemDetail(itemId, rowEl){
  const detailRow=$('detail-'+itemId);
  const content=$('detail-content-'+itemId);
  if(!detailRow) return;
  const isOpen=detailRow.style.display!=='none';
  // Đóng tất cả detail đang mở
  document.querySelectorAll('.item-detail-row').forEach(r=>r.style.display='none');
  document.querySelectorAll('.item-row').forEach(r=>r.classList.remove('row-active'));
  if(isOpen) return; // Toggle off
  detailRow.style.display='';
  rowEl.classList.add('row-active');
  // Load lịch sử
  content.innerHTML='<div style="padding:20px;text-align:center;color:#94a3b8">Đang tải...</div>';
  try{
    const logs=await api('/items/'+itemId+'/tinh-hinh');
    content.innerHTML=renderItemDetail(itemId, logs);
  } catch(e){ content.innerHTML='<div style="padding:20px;color:#dc2626">Lỗi tải dữ liệu</div>'; }
}

function renderItemDetail(itemId, logs){
  return `<div class="item-detail-inner">
    <div class="item-detail-header">
      <span style="font-size:14px;font-weight:700;color:#0f172a">📋 Lịch sử tình hình triển khai</span>
      <button class="btn-primary btn-sm js-nhap-lieu" onclick="openAddTinhHinh(${itemId})">➕ Thêm cập nhật</button>
    </div>
    <div id="tinh-hinh-form-${itemId}" style="display:none;padding:12px 16px;background:#eff6ff;border-bottom:1px solid #bfdbfe">
      <textarea id="th-input-${itemId}" rows="3" placeholder="Nhập tình hình triển khai..."
        style="width:100%;border:1px solid #bfdbfe;border-radius:8px;padding:10px;font-size:13px;font-family:inherit;resize:vertical;outline:none"></textarea>
      ${thAttachHTML('th-file-'+itemId)}
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="btn-primary btn-sm" onclick="saveTinhHinh(${itemId})">💾 Lưu</button>
        <button class="btn-outline btn-sm" onclick="closeTinhHinhForm(${itemId})">Hủy</button>
      </div>
    </div>
    <div id="tinh-hinh-list-${itemId}">
      ${logs.length ? logs.map(l=>`
        <div class="th-log-item">
          <div class="th-log-dot"></div>
          <div class="th-log-body">
            ${l.noi_dung?`<div class="th-log-text">${esc(l.noi_dung)}</div>`:''}
            ${thFilesHTML(l.files, fid=>`delThFileItem(${fid},${itemId})`)}
            <div class="th-log-meta">
              <span>${fmtDateTime(l.created_at)}</span>
              <button class="th-log-del js-nhap-lieu" onclick="deleteTinhHinh(${l.id},${itemId})">🗑</button>
            </div>
          </div>
        </div>`).join('')
      : '<div style="padding:16px 20px;color:#94a3b8;font-size:13px">Chưa có cập nhật nào. Nhấn ➕ để thêm.</div>'}
    </div>
  </div>`;
}

/* ── Văn bản đính kèm tình hình (PDF, Word) ── */
const TH_FILE_EXT = ['.pdf','.doc','.docx'];
const TH_FILE_MAX = 20*1024*1024;

function fmtFileSize(b){
  return b>=1048576 ? (b/1048576).toFixed(1)+' MB' : Math.max(1,Math.round(b/1024))+' KB';
}

/* Danh sách file của 1 cập nhật. onDel: fileId => chuỗi JS gọi khi xóa (bỏ trống = chỉ xem) */
function thFilesHTML(files, onDel){
  if(!files||!files.length) return '';
  return `<div class="th-files">${files.map(f=>`
    <span class="th-file" onclick="event.stopPropagation()">
      ${/\.pdf$/i.test(f.ten_goc)?'📕':'📘'}
      <a href="/api/tinh-hinh-files/${f.id}" target="_blank" rel="noopener" title="${esc(f.ten_goc)}">${esc(f.ten_goc)}</a>
      <span class="th-file-size">${fmtFileSize(f.kich_thuoc)}</span>
      ${onDel?`<button class="th-log-del js-nhap-lieu" title="Xóa file" onclick="event.stopPropagation();${onDel(f.id)}">✕</button>`:''}
    </span>`).join('')}</div>`;
}

/* Nút chọn file + dòng hiển thị các file đã chọn, đặt trong form nhập tình hình */
function thAttachHTML(inputId){
  return `<div class="th-attach-row">
    <label class="th-attach-btn" for="${inputId}">📎 Đính kèm văn bản</label>
    <input type="file" id="${inputId}" multiple accept=".pdf,.doc,.docx" style="display:none"
      onchange="thShowPicked(this)">
    <span class="th-attach-picked" id="${inputId}-picked">PDF, Word · tối đa 20 MB/file</span>
  </div>`;
}

function thShowPicked(input){
  const files=[...input.files];
  $(input.id+'-picked').textContent = files.length
    ? files.map(f=>f.name).join(', ')
    : 'PDF, Word · tối đa 20 MB/file';
}

/* Kiểm tra trước khi lưu, để không tạo cập nhật rồi mới báo file sai */
function thCheckFiles(input){
  for(const f of (input?.files||[])){
    const ext=(f.name.match(/\.[^.]+$/)||[''])[0].toLowerCase();
    if(!TH_FILE_EXT.includes(ext)) return `"${f.name}" không phải file PDF hoặc Word`;
    if(f.size>TH_FILE_MAX) return `"${f.name}" vượt quá 20 MB`;
  }
  return '';
}

async function thUploadFiles(tinhHinhId, input){
  const loi=[];
  for(const f of (input?.files||[])){
    const r=await fetch('/api/tinh-hinh/'+tinhHinhId+'/files',{
      method:'POST',
      headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(f.name)},
      body:f,
    });
    if(!r.ok){
      const d=await r.json().catch(()=>({}));
      loi.push(d.error||`Không tải lên được "${f.name}"`);
    }
  }
  if(loi.length) toast(loi.join('\n'),true);
}

/* Lưu 1 cập nhật tình hình kèm văn bản. Trả về false nếu chưa lưu được. */
async function thSave(itemId, inputId, fileInputId){
  const txt=$(inputId)?.value?.trim()||'';
  const fileInput=$(fileInputId);
  const coFile=fileInput&&fileInput.files.length>0;
  if(!txt&&!coFile){ toast('Vui lòng nhập nội dung hoặc đính kèm văn bản',true); return false; }
  const loi=thCheckFiles(fileInput);
  if(loi){ toast(loi,true); return false; }
  const {id}=await api('/items/'+itemId+'/tinh-hinh',{method:'POST',body:{noi_dung:txt}});
  if(coFile) await thUploadFiles(id, fileInput);
  toast('Đã lưu tình hình triển khai');
  return true;
}

async function thDeleteFile(fileId){
  if(!confirm('Xóa văn bản đính kèm này?')) return false;
  await api('/tinh-hinh-files/'+fileId,{method:'DELETE'});
  toast('Đã xóa văn bản');
  return true;
}

function openAddTinhHinh(itemId){
  $('tinh-hinh-form-'+itemId).style.display='block';
  $('th-input-'+itemId)?.focus();
}
function closeTinhHinhForm(itemId){ $('tinh-hinh-form-'+itemId).style.display='none'; }

async function saveTinhHinh(itemId){
  if(!await thSave(itemId, 'th-input-'+itemId, 'th-file-'+itemId)) return;
  await reloadItemDetail(itemId);
}

async function reloadItemDetail(itemId){
  const logs=await api('/items/'+itemId+'/tinh-hinh');
  $('detail-content-'+itemId).innerHTML=renderItemDetail(itemId,logs);
}

async function delThFileItem(fileId, itemId){
  if(await thDeleteFile(fileId)) await reloadItemDetail(itemId);
}

async function deleteTinhHinh(id, itemId){
  if(!confirm('Xóa cập nhật này?')) return;
  await api('/tinh-hinh/'+id,{method:'DELETE'});
  const logs=await api('/items/'+itemId+'/tinh-hinh');
  $('detail-content-'+itemId).innerHTML=renderItemDetail(itemId,logs);
  toast('Đã xóa');
}

/* ══════════════════════════════════════
   NHẬP LIỆU – PROJECTS
══════════════════════════════════════ */
async function loadProjects(){
  projects=await api('/projects');
  ['f-proj-filter','f-project','f-project-excel'].forEach(id=>{
    const el=$(id); if(!el) return;
    const v=el.value;
    el.innerHTML=(id==='f-proj-filter'?'<option value="">Tất cả dự án</option>':'<option value="">-- Chọn dự án --</option>')
      +projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
    el.value=v;
  });
}

function renderProjManageList(){
  // Form thêm mới: người phụ trách mặc định là người đang đăng nhập
  if(!editingProjId && $('pm-manager')) $('pm-manager').value=currentUser?.name||'';
  const el=$('proj-manage-list'); if(!el) return;
  if(!projects.length){
    el.innerHTML='<div style="padding:20px;text-align:center;color:#94a3b8;font-size:14px">Chưa có dự án nào</div>';
    return;
  }
  el.innerHTML=projects.map((p,i)=>{
    const col=PROJ_COLORS[i%PROJ_COLORS.length];
    const pct=p.progress||0;
    return `<div class="proj-manage-item">
      <div class="proj-manage-avatar" style="background:${col}18;color:${col}">${esc((p.code||p.name).substring(0,3))}</div>
      <div class="proj-manage-info">
        <div class="proj-manage-name">${esc(p.name)}</div>
        <div class="proj-manage-meta">
          ${p.start_date?fmtDate(p.start_date):'?'} → ${p.end_date?fmtDate(p.end_date):'?'}
          &nbsp;·&nbsp; ${p.total||0} HM &nbsp;·&nbsp; ${pct}% HT
          &nbsp;·&nbsp; 👤 ${esc(p.manager_name)||'Chưa có người phụ trách'}
        </div>
      </div>
      <div class="proj-manage-actions js-nhap-lieu">
        <button class="btn-edit" onclick="startEditProject(${p.id})">✏ Sửa</button>
        <button class="btn-archive" onclick="openArchiveModal(${p.id})" title="Đánh dấu hoàn thành & lưu vào lịch sử">✅ HT</button>
        <button class="btn-danger btn-sm" onclick="deleteProject(${p.id})">🗑</button>
      </div>
    </div>`;
  }).join('');
}

function startEditProject(id){
  const p=projects.find(x=>x.id===id); if(!p) return;
  editingProjId=id;
  $('pm-name').value  =p.name||'';
  $('pm-code').value  =p.code||'';
  $('pm-budget').value=p.budget||'';
  $('pm-start').value =p.start_date?.split('T')[0]||'';
  $('pm-end').value   =p.end_date?.split('T')[0]||'';
  $('pm-note').value  =p.note||'';
  $('pm-manager').value=p.manager_name||'—';
  $('proj-form-head').textContent='Sửa dự án';
  document.querySelector('[onclick="saveProject()"]').textContent='💾 Lưu thay đổi';
  $('btn-cancel-proj').style.display='';
  $('pm-name').focus({preventScroll:true});
}

function cancelEditProject(){
  editingProjId=null;
  ['pm-name','pm-code','pm-note','pm-start','pm-end'].forEach(id=>$(id).value='');
  $('pm-budget').value='';
  $('pm-manager').value=currentUser?.name||'';
  $('proj-form-head').textContent='Thêm dự án mới';
  document.querySelector('[onclick="saveProject()"]').textContent='➕ Thêm dự án';
  $('btn-cancel-proj').style.display='none';
}

async function saveProject(){
  const name=$('pm-name').value.trim();
  if(!name){ toast('Vui lòng nhập tên dự án',true); return; }
  const body={
    name, code:$('pm-code').value.trim(), note:$('pm-note').value.trim(),
    start_date:$('pm-start').value||null, end_date:$('pm-end').value||null,
    budget:$('pm-budget').value||0,
  };
  if(editingProjId){
    await api('/projects/'+editingProjId,{method:'PUT',body});
    toast('Đã cập nhật dự án');
  } else {
    await api('/projects',{method:'POST',body});
    toast('Đã thêm dự án mới');
  }
  cancelEditProject();
  await loadProjects(); renderProjManageList(); loadItems();
}

async function deleteProject(id){
  const p=projects.find(x=>x.id===id);
  if(!confirm(`Xóa dự án "${p?.name}" và toàn bộ hạng mục bên trong?`)) return;
  await api('/projects/'+id,{method:'DELETE'});
  toast('Đã xóa dự án');
  await loadProjects(); renderProjManageList(); loadItems();
}

/* ══════════════════════════════════════
   NHẬP LIỆU – ITEMS
══════════════════════════════════════ */
/* ── Tính trạng thái tự động từ ngày (dùng cùng logic backend) ── */
function calcAutoStatus(startVal, endVal) {
  if (!startVal || !endVal) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(startVal);
  const end   = new Date(endVal);
  if (today < start) return 'chua_bat_dau';
  if (today > end)   return 'qua_han';
  const daysLeft = Math.ceil((end - today) / 86400000);
  if (daysLeft <= 3) return 'cham_tien_do';
  return 'dang_thuc_hien';
}

function updateAutoStatus() {
  const startVal = $('f-start').value;
  const endVal   = $('f-end').value;
  const display  = $('f-status-display');
  const hidden   = $('f-status');

  // Nếu đang check hoàn thành thì giữ nguyên
  const doneBox = $('f-done');
  if (doneBox && doneBox.checked) return;

  const st = calcAutoStatus(startVal, endVal);
  if (!st) {
    display.textContent = '— Nhập ngày để tính —';
    display.style.cssText = 'color:#64748b;background:#f8fafc;border-color:#e2e8f0';
    hidden.value = 'chua_bat_dau';
    return;
  }
  hidden.value = st;
  const info = STATUS[st] || { label: st, color: '#94a3b8' };
  display.textContent = info.label;
  const colorMap = {
    chua_bat_dau:   { bg:'#f1f5f9', border:'#cbd5e1', color:'#475569' },
    dang_thuc_hien: { bg:'#dbeafe', border:'#93c5fd', color:'#1d4ed8' },
    qua_han:        { bg:'#fee2e2', border:'#fca5a5', color:'#991b1b' },
    cham_tien_do:   { bg:'#fef3c7', border:'#fde68a', color:'#92400e' },
  };
  const cm = colorMap[st] || { bg:'#f1f5f9', border:'#cbd5e1', color:'#475569' };
  display.style.cssText = `background:${cm.bg};border-color:${cm.border};color:${cm.color}`;
}

function toggleDone(checkbox) {
  const lateMsg   = $('done-late-msg');
  const dateWrap  = $('done-date-wrap');
  const doneDateEl= $('f-done-date');
  const hidden    = $('f-status');
  const display   = $('f-status-display');

  if (checkbox.checked) {
    hidden.value = 'hoan_thanh';
    display.textContent = '✅ Hoàn thành';
    display.style.cssText = 'background:#d1fae5;border-color:#6ee7b7;color:#065f46';
    // Hiện ô nhập ngày, mặc định = hôm nay
    dateWrap.style.display = '';
    if (!doneDateEl.value) {
      doneDateEl.value = new Date().toISOString().split('T')[0];
    }
    recalcLate();
  } else {
    dateWrap.style.display = 'none';
    lateMsg.style.display  = 'none';
    updateAutoStatus();
  }
}

function recalcLate() {
  const endVal    = $('f-end').value;
  const doneVal   = $('f-done-date').value;
  const lateMsg   = $('done-late-msg');
  const noteEl    = $('f-note');
  if (!endVal || !doneVal) return;

  const end  = new Date(endVal);  end.setHours(0,0,0,0);
  const done = new Date(doneVal); done.setHours(0,0,0,0);
  const late = Math.ceil((done - end) / 86400000);

  // Xóa ghi chú tự động cũ trước khi thêm mới
  const cleanNote = (noteEl.value||'')
    .split('\n').filter(l=>!l.startsWith('Hoàn thành trễ')&&!l.startsWith('Hoàn thành đúng')).join('\n').trim();

  if (late > 0) {
    const autoNote = `Hoàn thành trễ ${late} ngày (kế hoạch: ${end.toLocaleDateString('vi-VN')}, thực tế: ${done.toLocaleDateString('vi-VN')})`;
    lateMsg.textContent = `⚠ ${autoNote}`;
    lateMsg.style.cssText = 'display:block;background:#fef3c7;border:1px solid #fde68a;color:#92400e;margin-top:10px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500';
    noteEl.value = cleanNote ? cleanNote + '\n' + autoNote : autoNote;
  } else if (late < 0) {
    const early = Math.abs(late);
    const autoNote = `Hoàn thành trước hạn ${early} ngày (kế hoạch: ${end.toLocaleDateString('vi-VN')}, thực tế: ${done.toLocaleDateString('vi-VN')})`;
    lateMsg.textContent = `✅ ${autoNote}`;
    lateMsg.style.cssText = 'display:block;background:#d1fae5;border:1px solid #6ee7b7;color:#065f46;margin-top:10px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500';
    noteEl.value = cleanNote ? cleanNote + '\n' + autoNote : autoNote;
  } else {
    lateMsg.textContent = '✅ Hoàn thành đúng ngày kế hoạch';
    lateMsg.style.cssText = 'display:block;background:#d1fae5;border:1px solid #6ee7b7;color:#065f46;margin-top:10px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500';
    noteEl.value = cleanNote;
  }
}

function openItemForm(item=null){
  const w=$('item-form-wrap');
  w.style.display='block';
  $('form-title').textContent=item?'Sửa hạng mục':'Thêm hạng mục mới';
  $('f-id').value        =item?.id||'';
  $('f-name').value      =item?.name||'';
  $('f-project').value   =item?.project_id||'';
  $('f-group').value     =item?.group_name||'';
  $('f-contractor').value=item?.contractor||'';
  $('f-assignee').value  =item ? (item.assignee||'—') : (currentUser?.name||'');
  $('f-start').value     =item?.start_date?.split('T')[0]||'';
  $('f-end').value       =item?.end_date?.split('T')[0]||'';
  $('f-priority').value  =item?.priority||'binh_thuong';
  $('f-note').value      =item?.note||'';

  // Reset checkbox hoàn thành
  const doneWrap=$('done-wrap'), doneBox=$('f-done'), lateMsg=$('done-late-msg');
  doneBox.checked=false;
  lateMsg.style.display='none';

  if(item) {
    doneWrap.style.display='';
    $('f-status').value=item.status||'chua_bat_dau';
    if(item.status==='hoan_thanh'){
      doneBox.checked=true;
      $('f-status-display').textContent='✅ Hoàn thành';
      $('f-status-display').style.cssText='background:#d1fae5;border-color:#6ee7b7;color:#065f46';
      // Hiện ô ngày, set từ done_date đã lưu hoặc hôm nay
      if($('done-date-wrap')) $('done-date-wrap').style.display='';
      if($('f-done-date')) $('f-done-date').value = item.done_date||new Date().toISOString().split('T')[0];
      recalcLate();
    } else {
      if($('done-date-wrap')) $('done-date-wrap').style.display='none';
      updateAutoStatus();
    }
  } else {
    // Đang thêm mới → ẩn checkbox
    doneWrap.style.display='none';
    updateAutoStatus();
  }
}

function closeItemForm(){
  $('item-form-wrap').style.display='none';
  $('item-form').reset();
  $('f-status-display').textContent='— Nhập ngày để tính —';
  $('f-status-display').style.cssText='color:#64748b;background:#f8fafc;border-color:#e2e8f0';
  $('done-late-msg').style.display='none';
  $('done-wrap').style.display='none';
  if($('done-date-wrap')) $('done-date-wrap').style.display='none';
}

$('item-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const id=$('f-id').value;
  const body={
    project_id:$('f-project').value, name:$('f-name').value.trim(),
    group_name:$('f-group').value,   contractor:$('f-contractor').value,
    start_date:$('f-start').value,
    end_date:$('f-end').value,       status:$('f-status').value,
    priority:$('f-priority').value,
    done_date:$('f-done')?.checked ? ($('f-done-date')?.value||null) : null,
    note:$('f-note').value,
  };
  try {
    if(id){ await api('/items/'+id,{method:'PUT',body}); toast('Đã cập nhật hạng mục'); }
    else  { await api('/items',{method:'POST',body});    toast('Đã thêm hạng mục mới'); }
    closeItemForm(); loadItems();
  } catch(err){ toast(err.message,true); }
});

let _allNLItems=[], _nlPage=1;
const NL_PER=10;

async function loadItems(page=1){
  const p=$('f-proj-filter')?.value||'';
  const s=$('f-status-filter')?.value||'';
  const q=$('f-search')?.value||'';
  const params=new URLSearchParams();
  if(p) params.set('project_id',p);
  if(s) params.set('status',s);
  if(q) params.set('search',q);
  _allNLItems=await api('/items?'+params);
  _nlPage=1; // luôn về trang 1 khi load/lọc mới
  if(page>1) _nlPage=page; // chỉ giữ page nếu gọi từ nút phân trang
  renderItemsPage();
}

function renderItemsPage(){
  const items=_allNLItems;
  const total=items.length;
  const totalPages=Math.max(1,Math.ceil(total/NL_PER));
  _nlPage=Math.max(1,Math.min(_nlPage,totalPages));
  const pageItems=items.slice((_nlPage-1)*NL_PER, _nlPage*NL_PER);

  const countEl=$('items-count');
  if(countEl) countEl.textContent=`${total} hạng mục · Trang ${_nlPage}/${totalPages}`;

  $('items-tbody').innerHTML=pageItems.map((item,i)=>{
    const idx=(_nlPage-1)*NL_PER+i+1;
    const st=STATUS[item.status]||{label:item.status,pill:'p-gray'};
    const od=item.end_date&&item.status!=='hoan_thanh'&&new Date(item.end_date)<new Date();
    const pri=item.priority==='khan_cap'?'🔴 ':item.priority==='quan_trong'?'⭐ ':'';
    return `<tr>
      <td style="color:#94a3b8;font-size:13px">${idx}</td>
      <td>
        <div class="tbl-name">${pri}${esc(item.name)}</div>
        ${item.group_name?`<div class="tbl-sub">${esc(item.group_name)}</div>`:''}
      </td>
      <td style="color:#475569">${esc(item.project_name)}</td>
      <td><span class="pill ${st.pill}">${st.label}</span></td>
      <td style="color:#475569">${fmtDate(item.start_date)}</td>
      <td style="${od?'color:#dc2626;font-weight:700':'color:#64748b'}">${fmtDate(item.end_date)}</td>
      <td style="color:#475569">${esc(item.assignee)||'—'}</td>
      <td style="text-align:center" class="js-nhap-lieu">
        <button class="btn-edit btn-sm" onclick='editItem(${JSON.stringify(item)})'>✏ Sửa</button>
        <button class="btn-danger btn-sm" onclick="delItem(${item.id})">🗑</button>
      </td>
    </tr>`;
  }).join('')||`<tr><td colspan="8" class="tbl-empty">Không có hạng mục. Nhấn ➕ Thêm hạng mục để bắt đầu.</td></tr>`;

  // Pagination
  const pgWrap=$('nl-pagination');
  if(!pgWrap) return;
  if(totalPages<=1){ pgWrap.innerHTML=''; return; }
  pgWrap.innerHTML=`
    <button class="pg-btn" onclick="loadItems(${_nlPage-1})" ${_nlPage<=1?'disabled':''}>‹ Trước</button>
    ${Array.from({length:totalPages},(_,i)=>i+1).map(pg=>`
      <button class="pg-btn${pg===_nlPage?' active':''}" onclick="loadItems(${pg})">${pg}</button>
    `).join('')}
    <button class="pg-btn" onclick="loadItems(${_nlPage+1})" ${_nlPage>=totalPages?'disabled':''}>Sau ›</button>
    <span class="pg-info">${total} hạng mục · trang ${_nlPage}/${totalPages}</span>`;
}

function editItem(item){ openItemForm(item); }

async function delItem(id){
  if(!confirm('Xóa hạng mục này?')) return;
  await api('/items/'+id,{method:'DELETE'});
  toast('Đã xóa hạng mục'); loadItems();
}

$('f-proj-filter').addEventListener('change',loadItems);
$('f-status-filter').addEventListener('change',loadItems);
$('f-search').addEventListener('keyup',e=>{ if(e.key==='Enter'||!e.target.value) loadItems(); });

/* ══════════════════════════════════════
   NHẬP TỪ EXCEL
══════════════════════════════════════ */
function openExcelImport(){
  $('excel-import-wrap').style.display='block';
}
function downloadItemCsvTemplate(){
  const header='Tên hạng mục,Gói thầu/Nhóm,Đơn vị thi công,Người phụ trách,Ngày bắt đầu,Ngày kết thúc,Ưu tiên,Ghi chú';
  const rows=[
    ['Khảo sát hiện trạng hạ tầng mạng','Gói 1 - Khảo sát','Công ty TNHH ABC','Nguyễn Văn A','05/08/2026','20/08/2026','Quan trọng','Bao gồm 3 chi nhánh'],
    ['Lập hồ sơ thiết kế kỹ thuật','Gói 1 - Khảo sát','Công ty TNHH ABC','Trần Thị B','21/08/2026','15/09/2026','Bình thường',''],
    ['Mua sắm thiết bị switch/router','Gói 2 - Thiết bị','Công ty CP XYZ','Lê Văn C','01/09/2026','30/09/2026','Khẩn cấp','Chờ duyệt giá'],
  ];
  const csv=[header,...rows.map(r=>r.join(','))].join('\r\n');
  const blob=new Blob(['﻿'+csv],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download='mau-nhap-hang-muc.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function closeExcelImport(){
  $('excel-import-wrap').style.display='none';
  $('excel-file').value='';
  $('excel-preview').innerHTML='';
}

let excelRows=[];
function onExcelFile(input){
  const file=input.files[0]; if(!file) return;

  // Đọc binary trước để detect encoding
  const binReader=new FileReader();
  binReader.onload=e=>{
    const bytes=new Uint8Array(e.target.result);

    // Kiểm tra BOM UTF-8 (EF BB BF)
    const hasUTF8BOM = bytes[0]===0xEF && bytes[1]===0xBB && bytes[2]===0xBF;
    // Kiểm tra BOM UTF-16 LE (FF FE)
    const hasUTF16LE = bytes[0]===0xFF && bytes[1]===0xFE;

    if(hasUTF16LE){
      // UTF-16 LE — Excel Windows thường lưu dạng này
      const text=new TextDecoder('utf-16le').decode(bytes.slice(2));
      parseCSV(text);
    } else if(hasUTF8BOM){
      // UTF-8 với BOM
      const text=new TextDecoder('utf-8').decode(bytes.slice(3));
      parseCSV(text);
    } else {
      // Thử UTF-8 trước, nếu có ký tự lạ thử windows-1258 (tiếng Việt Windows)
      let text=new TextDecoder('utf-8').decode(bytes);
      // Kiểm tra có ký tự lỗi không (dấu replacement character)
      if(text.includes('\uFFFD')){
        text=new TextDecoder('windows-1258').decode(bytes);
      }
      parseCSV(text);
    }
  };
  binReader.readAsArrayBuffer(file);
}

function parseCSV(text){
  const lines=text.trim().split(/\r?\n/);
  if(lines.length<2){ $('excel-preview').innerHTML='<div style="color:#dc2626;padding:10px">File không đúng định dạng hoặc trống.</div>'; return; }
  
  // Bỏ qua dòng đầu (header)
  excelRows=lines.slice(1).map(line=>{
    // Tách bằng dấu phẩy hoặc tab, xử lý quoted fields
    const cols=line.match(/(".*?"|[^,\t]+|(?<=,|\t)(?=,|\t|$))/g)||line.split(/,|\t/);
    const clean=cols.map(c=>(c||'').replace(/^"|"$/g,'').trim());
    return {
      name:       clean[0]||'',
      group_name: clean[1]||'',
      contractor: clean[2]||'',
      assignee:   clean[3]||'',
      start_date: parseDate(clean[4]),
      end_date:   parseDate(clean[5]),
      priority:   parsePriority(clean[6]),
      note:       clean[7]||'',
    };
  }).filter(r=>r.name);

  if(!excelRows.length){ $('excel-preview').innerHTML='<div style="color:#dc2626;padding:10px">Không tìm thấy dữ liệu hợp lệ.</div>'; return; }

  $('excel-preview').innerHTML=`
    <div style="margin-top:12px">
      <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px">Xem trước ${excelRows.length} hạng mục:</div>
      <div class="table-wrap"><table class="tbl" style="font-size:12px">
        <thead><tr><th>#</th><th>Tên hạng mục</th><th>Gói thầu</th><th>Phụ trách</th><th>Bắt đầu</th><th>Kết thúc</th><th>Ưu tiên</th></tr></thead>
        <tbody>${excelRows.map((r,i)=>`<tr>
          <td style="color:#94a3b8">${i+1}</td>
          <td><b>${esc(r.name)||'⚠ Trống'}</b></td>
          <td>${esc(r.group_name)||'—'}</td>
          <td>${esc(currentUser?.name)||'—'}</td>
          <td>${r.start_date||'—'}</td>
          <td>${r.end_date||'—'}</td>
          <td>${r.priority==='khan_cap'?'🔴':r.priority==='quan_trong'?'⭐':'—'}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div style="margin-top:12px;display:flex;gap:10px">
        <button class="btn-primary" onclick="importExcelRows()">📥 Nhập ${excelRows.length} hạng mục</button>
        <button class="btn-outline" onclick="closeExcelImport()">Hủy</button>
      </div>
    </div>`;
}

function parseDate(s){
  if(!s) return '';
  // Thử dd/mm/yyyy
  const m=s.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if(m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  // Thử yyyy-mm-dd
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return '';
}

function parsePriority(s){
  if(!s) return 'binh_thuong';
  const v=s.toLowerCase();
  if(v.includes('khẩn')||v.includes('khan')) return 'khan_cap';
  if(v.includes('quan')||v.includes('trọng')) return 'quan_trong';
  return 'binh_thuong';
}

async function importExcelRows(){
  const projId=$('f-proj-filter').value||$('f-project-excel').value;
  if(!projId){ toast('Vui lòng chọn dự án để nhập vào!',true); return; }
  let ok=0,fail=0;
  for(const row of excelRows){
    try{
      await api('/items',{method:'POST',body:{
        project_id:projId, name:row.name, group_name:row.group_name,
        contractor:row.contractor,
        start_date:row.start_date, end_date:row.end_date,
        priority:row.priority, note:row.note, status:'chua_bat_dau',
      }});
      ok++;
    } catch{ fail++; }
  }
  toast(`Đã nhập ${ok} hạng mục${fail?', lỗi '+fail+' dòng':''}`);
  closeExcelImport();
  loadItems();
}

/* ══════════════════════════════════════
   LỊCH SỬ / ARCHIVE
══════════════════════════════════════ */
function openArchiveModal(projId){
  $('archive-proj-id').value = projId;
  $('archive-note').value = '';
  $('modal-archive').style.display = 'flex';
}
function closeArchiveModal(){ $('modal-archive').style.display = 'none'; }

async function confirmArchive(){
  const id   = $('archive-proj-id').value;
  const note = $('archive-note').value.trim();
  if(!id) return;
  await api('/projects/'+id+'/archive', { method:'POST', body:{ note } });
  closeArchiveModal();
  toast('✅ Dự án đã được lưu vào Lịch sử');
  await loadProjects(); renderProjManageList(); loadItems();
}

async function loadArchives(){
  const archives = await api('/archives');
  const el = $('archive-list');
  if(!archives.length){
    el.innerHTML = '<div style="text-align:center;padding:60px;color:#94a3b8;font-size:15px">Chưa có dự án nào được lưu vào lịch sử.<br><small>Khi dự án hoàn thành, vào tab Nhập liệu → nhấn ✅ HT trên dự án đó.</small></div>';
    return;
  }
  el.innerHTML = archives.map(a=>{
    const p = a.project;
    const s = a.summary;
    const donePct = s.total_items>0 ? Math.round(s.done_items/s.total_items*100) : 0;
    return `<div class="archive-card">
      <div class="archive-card-head">
        <div>
          <div class="archive-card-title">${esc(p.name)}</div>
          <div class="archive-card-meta">
            ${p.code?`<span class="pill p-gray" style="font-size:11px">${esc(p.code)}</span>`:''}
            <span style="color:#64748b;font-size:13px">Lưu trữ lúc: ${fmtDateTime(p.archived_at)}</span>
          </div>
        </div>
        <div style="display:flex;gap:8px">
          <a href="/api/archives/${a.id}/export" class="btn-primary btn-sm" style="text-decoration:none;display:inline-flex;align-items:center;gap:4px">
            📥 Xuất JSON
          </a>
          <button class="btn-outline btn-sm js-nhap-lieu" onclick="unarchiveProject(${p.id})">↩ Khôi phục</button>
        </div>
      </div>

      ${p.archived_note?`<div class="archive-note-box">📝 ${esc(p.archived_note)}</div>`:''}

      <div class="archive-stats">
        <div class="astat"><div class="astat-val">${s.total_items}</div><div class="astat-label">Tổng HM</div></div>
        <div class="astat"><div class="astat-val" style="color:#059669">${s.done_items}</div><div class="astat-label">Hoàn thành</div></div>
        <div class="astat"><div class="astat-val" style="color:#2563eb">${donePct}%</div><div class="astat-label">Tỷ lệ HT</div></div>
        <div class="astat"><div class="astat-val">${p.start_date?fmtDate(p.start_date):'—'}</div><div class="astat-label">Bắt đầu</div></div>
        <div class="astat"><div class="astat-val">${p.end_date?fmtDate(p.end_date):'—'}</div><div class="astat-label">Kế hoạch xong</div></div>
      </div>

      <!-- Danh sách hạng mục -->
      <details class="archive-items-wrap">
        <summary class="archive-items-toggle">Xem ${a.items.length} hạng mục</summary>
        <div class="table-wrap">
          <table class="tbl" style="font-size:13px">
            <thead><tr><th>#</th><th>Hạng mục</th><th>Trạng thái</th><th>Ngày bắt đầu</th><th>Hạn HT</th><th>Phụ trách</th><th>Tình hình cuối</th></tr></thead>
            <tbody>
              ${a.items.map((i,idx)=>{
                const s2=STATUS[i.status]||{label:i.status,pill:'p-gray'};
                const lastTH=i.tinh_hinh&&i.tinh_hinh.length?i.tinh_hinh[i.tinh_hinh.length-1]:null;
                return `<tr>
                  <td style="color:#94a3b8">${idx+1}</td>
                  <td><div class="tbl-name" style="font-size:13px">${esc(i.name)}</div>${i.group_name?`<div class="tbl-sub">${esc(i.group_name)}</div>`:''}</td>
                  <td><span class="pill ${s2.pill}">${s2.label}</span></td>
                  <td style="color:#475569">${fmtDate(i.start_date)}</td>
                  <td style="color:#475569">${fmtDate(i.end_date)}</td>
                  <td style="color:#475569">${esc(i.assignee)||'—'}</td>
                  <td style="font-size:12px;color:#374151;max-width:200px">${lastTH?esc(lastTH.noi_dung):'—'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </details>
    </div>`;
  }).join('');
}

async function unarchiveProject(projId){
  if(!confirm('Khôi phục dự án này về trạng thái đang hoạt động?')) return;
  await api('/projects/'+projId+'/unarchive', { method:'POST' });
  toast('Đã khôi phục dự án');
  loadArchives();
}

async function resetAllData(){
  if(!confirm('⚠ Xóa TOÀN BỘ dữ liệu của đơn vị đang xem?\n\nTất cả dự án, hạng mục, lịch sử của đơn vị này sẽ bị xóa vĩnh viễn (đơn vị khác giữ nguyên).\nKhông thể hoàn tác!')) return;
  if(!confirm('Xác nhận lần 2: Bạn chắc chắn muốn xóa hết?')) return;
  await api('/reset', { method:'POST' });
  toast('Đã xóa toàn bộ dữ liệu');
  await loadProjects();
  renderProjManageList();
  loadItems();
}

/* ═══ BOOT ═══ */
startClock();
if(!routeFromURL()){
  loadProjects().then(()=>{ startDashboard(); });
}

/* ══════════════════════════════════════════════
   TRANG CHI TIẾT DỰ ÁN  –  /du-an/:id
══════════════════════════════════════════════ */
let _pdData = null; // cache data dự án hiện tại

function goHome(e){
  e.preventDefault();
  history.pushState({}, '', '/');
  showPage('dashboard');
}

// Nav link "Tổng quan" — xử lý cả khi đang ở trang dự án
function handleNavDashboard(e){
  e.preventDefault();
  history.pushState({}, '', '/');
  showPage('dashboard');
}

// Đóng sidebar sau khi chọn trang (UX tốt hơn)
document.addEventListener('click', e=>{
  const link = e.target.closest('.sidebar-link');
  if(link) $('sidebar')?.blur();
});

async function loadProjectDetail(projId){
  // Hiện trang
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l=>l.classList.remove('active'));
  $('page-du-an').classList.add('active');
  clearInterval(dashTimer);

  // Update URL
  history.pushState({ projId }, '', '/du-an/'+projId);

  try {
    const d = await api('/projects/'+projId+'/detail');
    _pdData = d;
    renderProjDetailHeader(d);
    renderGantt(d);
    renderPdTinhHinh(d.recentTH);
    renderPdItems(d.items);
    syncPdHeights();
  } catch(e) {
    $('pdh-title').textContent = 'Không tìm thấy dự án';
  }
}

/* ── Header ── */
/* Tính % tiến độ theo số lượng hạng mục (Cách A)
   % = số HM hoàn thành / tổng số HM × 100
*/
function calcProgressByDate(project, items){
  if(!items.length) return 0;
  const done = items.filter(i=>i.status==='hoan_thanh').length;
  return Math.round(done / items.length * 100);
}

function renderProjDetailHeader(d){
  const p   = d.project;
  const s   = d.summary;
  const pct = calcProgressByDate(p, d.items);

  $('pdh-title').textContent = p.name;

  const daysLeft = p.end_date ? Math.ceil((new Date(p.end_date)-new Date())/86400000) : null;
  const deadlineStr = daysLeft===null ? '' :
    daysLeft > 0  ? `⏱ Còn ${daysLeft} ngày` :
    daysLeft === 0 ? '⚠ Đến hạn hôm nay' :
                    `🔴 Quá hạn ${Math.abs(daysLeft)} ngày`;

  $('pdh-meta').innerHTML = `
    <span>📁 ${esc(p.code)||'—'}</span>
    <span>📅 ${p.start_date?fmtDate(p.start_date):'—'} → ${p.end_date?fmtDate(p.end_date):'—'}</span>
    ${deadlineStr?`<span>${deadlineStr}</span>`:''}`;

  const pColor2 = pct>=80?'#6ee7b7':pct>=50?'#93c5fd':pct>=20?'#fde68a':'#fca5a5';
  $('pdh-kpis').innerHTML = [
    { val: s.total,   label: 'Tổng HM',    color: '#fff' },
    { val: s.done,    label: 'Hoàn thành', color: '#6ee7b7' },
    { val: s.inprog,  label: 'Đang TH',    color: '#93c5fd' },
    { val: s.overdue, label: 'Quá hạn',    color: '#fca5a5' },
    { val: pct+'%',   label: 'Tiến độ',    color: pColor2 },
  ].map(k=>`<div class="pdh-kpi">
    <div class="pdh-kpi-val" style="color:${k.color}">${k.val}</div>
    <div class="pdh-kpi-label">${k.label}</div>
  </div>`).join('');
}

/* ── GANTT CHART ── */
const GANTT_STATUS_COLOR = {
  hoan_thanh:    '#10b981',
  dang_thuc_hien:'#3b82f6',
  cham_tien_do:  '#f59e0b',
  qua_han:       '#ef4444',
  chua_bat_dau:  '#cbd5e1',
  tam_dung:      '#94a3b8',
};

function renderGantt(d){
  const items   = d.items.filter(i=>i.start_date && i.end_date);
  const project = d.project;

  if(!items.length){
    $('gantt-wrap').innerHTML = '<div class="tbl-empty" style="padding:40px">Chưa có hạng mục nào có ngày bắt đầu và kết thúc.</div>';
    return;
  }

  // Xác định khoảng thời gian: lấy toàn bộ ngày của items + dự án
  const allDates = items.flatMap(i=>[new Date(i.start_date), new Date(i.end_date)]);
  if(project.start_date) allDates.push(new Date(project.start_date));
  if(project.end_date)   allDates.push(new Date(project.end_date));

  let minDate = new Date(Math.min(...allDates));
  let maxDate = new Date(Math.max(...allDates));

  // Thêm padding 1 tháng ở 2 đầu để không bị sát mép
  minDate = new Date(minDate.getFullYear(), minDate.getMonth()-1, 1);
  maxDate = new Date(maxDate.getFullYear(), maxDate.getMonth()+2, 0);

  const totalDays  = Math.ceil((maxDate - minDate) / 86400000) + 1;
  const LABEL_W    = 280;
  // Lấy chiều rộng container thực tế để tính DAY_W cho vừa khít
  // Đợi DOM render xong để lấy clientWidth chính xác
  const containerW = Math.max(
    ($('gantt-wrap').clientWidth || 0),
    window.innerWidth - LABEL_W - 80
  ) - LABEL_W - 24;
  const DAY_W      = Math.max(3, Math.floor(containerW / totalDays));
  const TIMELINE_W = totalDays * DAY_W;

  // Hàm tính vị trí
  const dateToX = d => Math.round((new Date(d) - minDate) / 86400000) * DAY_W;
  const dateToPct = d => ((new Date(d) - minDate) / 86400000) * DAY_W;

  // Tạo mảng tháng cho header
  const months = [];
  let cur = new Date(minDate);
  while(cur <= maxDate){
    const y = cur.getFullYear(), m = cur.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay  = new Date(y, m+1, 0);
    const left = dateToX(firstDay > minDate ? firstDay : minDate);
    const right= Math.min(dateToX(lastDay), TIMELINE_W);
    months.push({ label: cur.toLocaleDateString('vi-VN',{month:'short',year:'numeric'}), left, width: right-left });
    cur = new Date(y, m+1, 1);
  }

  // Nhóm theo group_name
  const groups = {};
  items.forEach(i=>{
    const g = i.group_name || 'Khác';
    if(!groups[g]) groups[g]=[];
    groups[g].push(i);
  });

  // Vị trí đường "Hôm nay"
  const today    = new Date(); today.setHours(0,0,0,0);
  const todayX   = dateToX(today);
  const showToday= today >= minDate && today <= maxDate;

  // Build HTML
  let rowsHTML = '';
  Object.entries(groups).forEach(([grpName, grpItems])=>{
    // Header nhóm
    rowsHTML += `<div class="gantt-row group-row">
      <div class="gantt-row-label group">📦 ${esc(grpName)}</div>
      <div class="gantt-row-bars" style="width:${TIMELINE_W}px"></div>
    </div>`;

    // Các hạng mục trong nhóm
    grpItems.forEach(i=>{
      const x     = dateToPct(i.start_date);
      const x2    = dateToPct(i.end_date);
      const barW  = Math.max(DAY_W, x2 - x);
      const color = GANTT_STATUS_COLOR[i.status] || '#94a3b8';
      const s     = STATUS[i.status]||{label:i.status};
      const note  = deadlineNote(i);

      rowsHTML += `<div class="gantt-row">
        <div class="gantt-row-label" title="${esc(i.name)}">
          <span style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;display:inline-block"></span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px">${esc(i.name)}</span>
        </div>
        <div class="gantt-row-bars" style="width:${TIMELINE_W}px;position:relative">
          ${Array.from({length:months.length},(_,mi)=>`<div class="gantt-col-line" style="left:${months[mi].left}px"></div>`).join('')}
          ${showToday?`<div class="gantt-today" style="left:${todayX}px"></div>`:''}
          <div class="gantt-bar" style="left:${x}px;width:${barW}px;background:${color};opacity:${i.status==='chua_bat_dau'?0.5:1}">
            <div class="gantt-bar-tooltip">${esc(i.name)} · ${s.label} · ${note.text}</div>
            <span style="text-overflow:ellipsis;overflow:hidden;white-space:nowrap;max-width:${barW-16}px">
              ${barW > 60 ? esc(i.name) : ''}
            </span>
          </div>
        </div>
      </div>`;
    });
  });

  // Header tháng
  const monthHeaderHTML = months.map(m=>`
    <div class="gantt-month" style="left:${m.left}px;width:${m.width}px;position:absolute">${m.label}</div>
  `).join('');

  $('gantt-wrap').innerHTML = `<div class="gantt-wrap-inner">
    <div class="gantt-header">
      <div class="gantt-label-col">Hạng mục</div>
      <div class="gantt-timeline-col" style="width:${TIMELINE_W}px;position:relative;min-height:36px">${monthHeaderHTML}</div>
    </div>
    <div id="gantt-rows">${rowsHTML}</div>
  </div>`;
}

/* ── Đồng bộ chiều cao khung Tình hình triển khai với khung Bảng hạng mục ── */
let _pdHeightObs=null;
function syncPdHeights(){
  const leftBody=$('pdh-tinh-hinh');
  const grid=leftBody&&leftBody.closest('.proj-detail-grid');
  const rightCard=grid&&grid.children[1];
  if(!leftBody||!rightCard) return;
  const apply=()=>{
    const headH=leftBody.previousElementSibling?leftBody.previousElementSibling.getBoundingClientRect().height:0;
    const h=rightCard.getBoundingClientRect().height-headH;
    leftBody.style.maxHeight=Math.max(200,h)+'px';
  };
  apply();
  if(_pdHeightObs) _pdHeightObs.disconnect();
  if(typeof ResizeObserver!=='undefined'){
    _pdHeightObs=new ResizeObserver(apply);
    _pdHeightObs.observe(rightCard);
  }
}

/* ── Tình hình triển khai feed ── */
function renderPdTinhHinh(list){
  const el=$('pdh-tinh-hinh');
  if(!list||!list.length){
    el.innerHTML='<div style="padding:24px;color:#94a3b8;font-size:13px;text-align:center">Chưa có cập nhật tình hình nào.</div>';
    return;
  }
  el.innerHTML=list.map(l=>`
    <div class="th-feed-item">
      <div class="th-feed-dot"></div>
      <div class="th-feed-body">
        <div class="th-feed-item-name">${esc(l.item_name)}</div>
        ${l.noi_dung?`<div class="th-feed-text">${esc(l.noi_dung)}</div>`:''}
        ${thFilesHTML(l.files)}
        <div class="th-feed-time">
          ${fmtDateTime(l.created_at)}
          <button class="th-log-del js-nhap-lieu" onclick="deleteTinhHinhPd(${l.id})" title="Xóa">🗑</button>
        </div>
      </div>
    </div>`).join('');
}

async function deleteTinhHinhPd(id){
  if(!confirm('Xóa cập nhật này?')) return;
  await api('/tinh-hinh/'+id, {method:'DELETE'});
  toast('Đã xóa');
  // Reload lại trang dự án hiện tại
  if(_pdData){
    const d = await api('/projects/'+_pdData.project.id+'/detail');
    _pdData = d;
    renderPdTinhHinh(d.recentTH);
  }
}

/* ── Bảng hạng mục ── */
let _pdPage=1;
const PD_PER=10;

function renderPdItems(items, statusFilter='', page=1){
  const filtered = statusFilter ? items.filter(i=>i.status===statusFilter) : items;
  const total     = filtered.length;
  const totalPages= Math.max(1, Math.ceil(total/PD_PER));
  _pdPage = Math.max(1, Math.min(page, totalPages));
  const pageItems = filtered.slice((_pdPage-1)*PD_PER, _pdPage*PD_PER);

  $('pd-items-tbody').innerHTML = pageItems.map((i,idx)=>{
    const s    = STATUS[i.status]||{label:i.status,pill:'p-gray'};
    const note = deadlineNote(i);
    const num  = (_pdPage-1)*PD_PER + idx + 1;
    const lastTH = i.tinh_hinh?.length ? i.tinh_hinh[0] : null;
    return `<tr class="pd-item-row" onclick="togglePdItemDetail(${i.id},this)" style="cursor:pointer">
      <td style="color:#94a3b8">${num}</td>
      <td>
        <div class="tbl-name" style="font-size:13px">${esc(i.name)}</div>
        ${i.group_name?`<div class="tbl-sub">${esc(i.group_name)}</div>`:''}
      </td>
      <td><span class="pill ${s.pill}">${s.label}</span></td>
      <td style="color:#475569;white-space:nowrap">${fmtDate(i.start_date)}</td>
      <td style="color:#475569;white-space:nowrap">${fmtDate(i.end_date)}</td>
      <td style="color:#475569">${esc(i.assignee)||'—'}</td>
      <td>${lastTH?`<span class="th-preview">${esc(lastTH.noi_dung.substring(0,40))}${lastTH.noi_dung.length>40?'…':''}</span>`:'<span style="color:#94a3b8;font-size:12px">Chưa có</span>'}</td>
      <td><span style="${note.style}">${note.text}</span></td>
    </tr>
    <tr id="pd-detail-${i.id}" style="display:none">
      <td colspan="8" style="padding:0;background:#f8fafc;border-bottom:2px solid #e2e8f0">
        <div class="item-detail-inner">
          <div class="item-detail-header">
            <span style="font-size:14px;font-weight:700;color:#0f172a">📋 Tình hình triển khai – ${esc(i.name)}</span>
            <button class="btn-primary btn-sm js-nhap-lieu" onclick="event.stopPropagation();openAddTinhHinhPd(${i.id})">➕ Thêm cập nhật</button>
          </div>
          <div id="pd-th-form-${i.id}" style="display:none;padding:12px 16px;background:#eff6ff;border-bottom:1px solid #bfdbfe" onclick="event.stopPropagation()">
            <textarea id="pd-th-input-${i.id}" rows="3" placeholder="Nhập tình hình triển khai..."
              style="width:100%;border:1px solid #bfdbfe;border-radius:8px;padding:10px;font-size:13px;font-family:inherit;resize:vertical;outline:none"></textarea>
            ${thAttachHTML('pd-th-file-'+i.id)}
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn-primary btn-sm" onclick="event.stopPropagation();saveTinhHinhPd(${i.id})">💾 Lưu</button>
              <button class="btn-outline btn-sm" onclick="event.stopPropagation();$('pd-th-form-${i.id}').style.display='none'">Hủy</button>
            </div>
          </div>
          <div id="pd-th-list-${i.id}">
            ${i.tinh_hinh&&i.tinh_hinh.length ? i.tinh_hinh.map(l=>`
              <div class="th-log-item">
                <div class="th-log-dot"></div>
                <div class="th-log-body">
                  ${l.noi_dung?`<div class="th-log-text">${esc(l.noi_dung)}</div>`:''}
                  ${thFilesHTML(l.files, fid=>`delThFilePd(${fid})`)}
                  <div class="th-log-meta">
                    <span>${fmtDateTime(l.created_at)}</span>
                    <button class="th-log-del js-nhap-lieu" onclick="event.stopPropagation();delTinhHinhPd(${l.id},${i.id})">🗑</button>
                  </div>
                </div>
              </div>`).join('')
            : '<div style="padding:14px 20px;color:#94a3b8;font-size:13px">Chưa có cập nhật nào.</div>'}
          </div>
        </div>
      </td>
    </tr>`;
  }).join('')||`<tr><td colspan="8" class="tbl-empty">Không có hạng mục.</td></tr>`;

  // Pagination
  const pgWrap=$('pd-pagination');
  if(!pgWrap) return;
  if(totalPages<=1){ pgWrap.innerHTML=`<span class="pg-info">${total} hạng mục</span>`; return; }
  pgWrap.innerHTML=`
    <button class="pg-btn" onclick="pdGotoPage(${_pdPage-1})" ${_pdPage<=1?'disabled':''}>‹ Trước</button>
    ${Array.from({length:totalPages},(_,i)=>i+1).map(pg=>
      `<button class="pg-btn${pg===_pdPage?' active':''}" onclick="pdGotoPage(${pg})">${pg}</button>`
    ).join('')}
    <button class="pg-btn" onclick="pdGotoPage(${_pdPage+1})" ${_pdPage>=totalPages?'disabled':''}>Sau ›</button>
    <span class="pg-info">${total} hạng mục · trang ${_pdPage}/${totalPages}</span>`;
}

function pdGotoPage(page){
  if(!_pdData) return;
  const sf=$('pd-status-filter')?.value||'';
  renderPdItems(_pdData.items, sf, page);
}

function filterPdItems(){
  if(!_pdData) return;
  renderPdItems(_pdData.items, $('pd-status-filter')?.value||'', 1);
}

function togglePdItemDetail(itemId, rowEl){
  const detailRow=$('pd-detail-'+itemId);
  if(!detailRow) return;
  const isOpen = detailRow.style.display!=='none';
  // Đóng tất cả
  document.querySelectorAll('[id^="pd-detail-"]').forEach(r=>r.style.display='none');
  document.querySelectorAll('.pd-item-row').forEach(r=>r.classList.remove('row-active'));
  if(isOpen) return;
  detailRow.style.display='';
  rowEl.classList.add('row-active');
}

function openAddTinhHinhPd(itemId){
  const form=$('pd-th-form-'+itemId);
  if(form){ form.style.display='block'; $('pd-th-input-'+itemId)?.focus(); }
}

async function saveTinhHinhPd(itemId){
  if(!await thSave(itemId, 'pd-th-input-'+itemId, 'pd-th-file-'+itemId)) return;
  await reloadPdKeepOpen(itemId);
}

/* Tải lại trang chi tiết dự án, giữ hạng mục đang mở */
async function reloadPdKeepOpen(itemId){
  const d=await api('/projects/'+_pdData.project.id+'/detail');
  _pdData=d;
  renderPdItems(d.items, $('pd-status-filter')?.value||'', _pdPage);
  renderPdTinhHinh(d.recentTH);
  const row=$('pd-detail-'+itemId);
  if(row){ row.style.display=''; row.previousElementSibling?.classList.add('row-active'); }
}

async function delThFilePd(fileId){
  if(!await thDeleteFile(fileId)) return;
  const openRow=[...document.querySelectorAll('[id^="pd-detail-"]')].find(r=>r.style.display!=='none');
  await reloadPdKeepOpen(openRow?openRow.id.replace('pd-detail-',''):0);
}

async function delTinhHinhPd(id, itemId){
  if(!confirm('Xóa cập nhật này?')) return;
  await api('/tinh-hinh/'+id,{method:'DELETE'});
  const d=await api('/projects/'+_pdData.project.id+'/detail');
  _pdData=d;
  renderPdItems(d.items, $('pd-status-filter')?.value||'', _pdPage);
  renderPdTinhHinh(d.recentTH);
  toast('Đã xóa');
}

/* ── Router: đọc URL khi load ── */
function routeFromURL(){
  const path = window.location.pathname;
  const match = path.match(/^\/du-an\/(\d+)$/);
  if(match){
    loadProjectDetail(parseInt(match[1]));
    return true;
  }
  return false;
}

// Xử lý nút back/forward của browser
window.addEventListener('popstate', ()=>{
  if(!routeFromURL()) showPage('dashboard');
});

/* ══════════════════════════════════════
   CHATBOT
══════════════════════════════════════ */
let chatOpen = false;
let chatExpanded = false;

function toggleChat(){
  chatOpen = !chatOpen;
  $('chat-panel').style.display = chatOpen ? 'flex' : 'none';
  $('chat-bubble').classList.toggle('open', chatOpen);
  $('chat-bubble-icon').textContent = chatOpen ? '✕' : '🤖';
  if(chatOpen){
    $('chat-input').focus();
    $('chat-proactive-bubble')?.classList.remove('show');
  }
}

function toggleChatExpand(){
  chatExpanded = !chatExpanded;
  $('chat-panel').classList.toggle('expanded', chatExpanded);
  $('chat-expand-btn').textContent = chatExpanded ? '⤡' : '⤢';
  $('chat-expand-btn').title = chatExpanded ? 'Thu nhỏ' : 'Phóng to';
  $('chat-expand-btn').classList.toggle('active', chatExpanded);
}

function formatChatText(text){
  // esc() trước để an toàn XSS, rồi mới đổi **chữ** thành in đậm
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}

function addMsg(text, role='bot'){
  const wrap = $('chat-messages');
  const div  = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = `<div class="chat-msg-bubble">${formatChatText(text)}</div>`;
  wrap.appendChild(div);
  wrap.scrollTop = wrap.scrollHeight;
  return div;
}

async function sendChat(){
  const input = $('chat-input');
  const msg   = input.value.trim();
  if(!msg) return;

  input.value = '';
  addMsg(msg, 'user');

  // Ẩn quick buttons sau lần hỏi đầu
  const quickBtns = $('chat-quick');
  if(quickBtns) quickBtns.style.display = 'none';

  // Hiện typing indicator
  const thinking = addMsg('⏳ Đang phân tích dữ liệu...', 'bot thinking');
  $('chat-send-btn').disabled = true;

  try {
    const res  = await fetch('/api/chat', {
      method:  'POST',
      headers: {'Content-Type':'application/json'},
      body:    JSON.stringify({ message: msg }),
    });
    const data = await res.json();
    thinking.remove();
    if(data.error) addMsg('❌ Lỗi: '+data.error, 'bot');
    else           addMsg(data.reply, 'bot');
  } catch(e) {
    thinking.remove();
    addMsg('❌ Không kết nối được server. Thử lại sau.', 'bot');
  } finally {
    $('chat-send-btn').disabled = false;
    $('chat-input').focus();
  }
}

function sendQuick(msg){
  $('chat-input').value = msg;
  sendChat();
}

/* ══════════════════════════════════════
   THÔNG BÁO CHỦ ĐỘNG TỪ CHATBOT
   Khi chat đang đóng, thỉnh thoảng (5-10p) tự nhắc
   1 hạng mục quá hạn/chậm tiến độ, hoặc câu vu vơ
══════════════════════════════════════ */
const PROACTIVE_CASUAL_MSGS = [
  'Cần mình tóm tắt nhanh tình hình các dự án không? 👋',
  'Có hạng mục nào cần rà soát lại không nhỉ? 🔍',
  'Rảnh ghé hỏi mình tình hình dự án nha 😊',
  'Mình vẫn đang theo dõi dữ liệu dự án đây, hỏi gì cứ hỏi nhé!',
  'Sắp đến hạn báo cáo chưa nhỉ? Hỏi mình nếu cần tổng hợp nhanh.',
];
let _proactiveTimer = null;
let _proactiveHideTimer = null;
let _lastProactiveItemId = null;

function scheduleProactiveChat(){
  clearTimeout(_proactiveTimer);
  const delay = 30 * 1000; // TESTING: 30s — đổi lại thành (5 + Math.random()*5) * 60 * 1000 (5-10 phút) khi lên thật
  _proactiveTimer = setTimeout(showProactiveChatBubble, delay);
}

function showProactiveChatBubble(){
  scheduleProactiveChat(); // hẹn lượt tiếp theo dù lượt này có hiện hay không
  if(chatOpen) return; // đang mở chat thì bỏ qua lượt này

  const problemItems = (_allDashItems||[]).filter(i =>
    (i.status==='qua_han' || i.status==='cham_tien_do') && i.id !== _lastProactiveItemId
  );

  let text;
  if(problemItems.length && Math.random() < 0.7){
    const item = problemItems[Math.floor(Math.random()*problemItems.length)];
    _lastProactiveItemId = item.id;
    const dl = deadlineNote(item);
    const icon = item.status==='qua_han' ? '⏰' : '⚠️';
    text = `${icon} Hạng mục "${item.name}" đang ${dl.text.toLowerCase()}. Xem chi tiết nhé?`;
  } else {
    text = PROACTIVE_CASUAL_MSGS[Math.floor(Math.random()*PROACTIVE_CASUAL_MSGS.length)];
  }

  const el = $('chat-proactive-bubble');
  if(!el) return;
  el.textContent = text;
  el.classList.add('show');

  clearTimeout(_proactiveHideTimer);
  _proactiveHideTimer = setTimeout(()=> el.classList.remove('show'), 12000);
}

function onProactiveBubbleClick(){
  $('chat-proactive-bubble').classList.remove('show');
  clearTimeout(_proactiveHideTimer);
  if(!chatOpen) toggleChat();
}

scheduleProactiveChat();
