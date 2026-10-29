'use strict';
/* ═══════════════════════════════════════════════════════
   BÁO CÁO QUẢN LÝ DỰ ÁN  —  report.js
   Dùng lại API sẵn có, KHÔNG sửa backend:
     GET /api/stats                → tổng quan toàn bộ
     GET /api/projects/:id/detail  → chi tiết 1 dự án
   ═══════════════════════════════════════════════════════ */

const STATUS = {
  chua_bat_dau:   { label:'Chưa bắt đầu',   cls:'s-idle', color:'#94a3b8' },
  dang_thuc_hien: { label:'Đang thực hiện', cls:'s-prog', color:'#3b82f6' },
  hoan_thanh:     { label:'Hoàn thành',     cls:'s-done', color:'#10b981' },
  cham_tien_do:   { label:'Chậm tiến độ',   cls:'s-slow', color:'#f59e0b' },
  qua_han:        { label:'Quá hạn',        cls:'s-late', color:'#ef4444' },
  tam_dung:       { label:'Tạm dừng',       cls:'s-idle', color:'#cbd5e1' },
};
const ORDER = ['hoan_thanh','dang_thuc_hien','cham_tien_do','qua_han','chua_bat_dau','tam_dung'];

/* ── Helpers ── */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const fmtDate = d => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtDT = d => {
  if (!d) return '—';
  const t = new Date(d);
  return t.toLocaleDateString('vi-VN') + ' ' +
         t.toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' });
};
const money = v => {
  const n = Number(v) || 0;
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace('.0','') + ' tỷ';
  if (n >= 1e6) return Math.round(n / 1e6) + ' tr';
  return n.toLocaleString('vi-VN');
};
const dDiff = (a, b) => Math.round((a - b) / 86400000);
const today0 = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const pColor = p => p >= 80 ? '#10b981' : p >= 50 ? '#3b82f6' : p >= 20 ? '#f59e0b' : '#ef4444';

/* Tình trạng thời hạn của 1 hạng mục */
function deadline(it) {
  if (it.status === 'hoan_thanh') return '<span class="txt-ok">Đã xong</span>';
  if (!it.end_date) return '<span class="txt-ok">—</span>';
  const d = dDiff(new Date(it.end_date), today0());
  if (d < 0)  return `<span class="txt-late">Trễ ${Math.abs(d)} ngày</span>`;
  if (d === 0) return '<span class="txt-late">Hôm nay</span>';
  return `<span class="txt-ok">Còn ${d} ngày</span>`;
}

/* ═══════════ BIỂU ĐỒ TRÒN (donut) ═══════════ */
function donut(byStatus) {
  const data = ORDER
    .map(k => ({ k, ...STATUS[k], v: (byStatus.find(s => s.status === k) || {}).c || 0 }))
    .filter(d => d.v > 0);
  const total = data.reduce((s, d) => s + d.v, 0);
  if (!total) return '<div class="none">Chưa có hạng mục nào.</div>';

  const R = 52, r = 32, C = 62, TAU = Math.PI * 2;
  let a0 = -Math.PI / 2, arcs = '';

  data.forEach(d => {
    const a1 = a0 + (d.v / total) * TAU;
    const big = (a1 - a0) > Math.PI ? 1 : 0;
    const p = (ang, rad) => [
      (C + rad * Math.cos(ang)).toFixed(2),
      (C + rad * Math.sin(ang)).toFixed(2)
    ];
    /* Trường hợp chỉ 1 trạng thái: vẽ vòng tròn đầy, tránh lỗi cung 360° */
    if (data.length === 1) {
      arcs = `<circle cx="${C}" cy="${C}" r="${(R + r) / 2}" fill="none"
                      stroke="${d.color}" stroke-width="${R - r}"/>`;
      return;
    }
    const [x1, y1] = p(a0, R), [x2, y2] = p(a1, R);
    const [x3, y3] = p(a1, r), [x4, y4] = p(a0, r);
    arcs += `<path d="M${x1},${y1} A${R},${R} 0 ${big},1 ${x2},${y2}
                      L${x3},${y3} A${r},${r} 0 ${big},0 ${x4},${y4} Z"
                   fill="${d.color}"/>`;
    a0 = a1;
  });

  const done = (byStatus.find(s => s.status === 'hoan_thanh') || {}).c || 0;
  const pct = Math.round(done / total * 100);

  const legend = data.map(d => `
    <div><i style="background:${d.color}"></i>${d.label}<b>${d.v}</b></div>`).join('');

  return `
    <div class="donut-wrap">
      <svg class="donut" width="124" height="124" viewBox="0 0 124 124" role="img"
           aria-label="Tỷ lệ hạng mục theo trạng thái">
        ${arcs}
        <text x="${C}" y="${C - 2}" text-anchor="middle" font-size="21"
              font-weight="800" fill="#0f172a">${pct}%</text>
        <text x="${C}" y="${C + 14}" text-anchor="middle" font-size="10" fill="#94a3b8">
          hoàn thành
        </text>
      </svg>
      <div class="dlegend">${legend}</div>
    </div>`;
}

/* ═══════════ CỘT TIẾN ĐỘ THEO DỰ ÁN ═══════════ */
function projBars(projects) {
  if (!projects.length) return '<div class="none">Chưa có dự án nào.</div>';
  return projects.map(p => {
    const pr = Number(p.progress) || 0;
    return `
      <div class="pbar">
        <div class="pbar-top">
          <span class="nm">${esc(p.name)}</span>
          <span class="vv">${p.done}/${p.total} HM · <b>${pr}%</b></span>
        </div>
        <div class="track">
          <div class="fill" style="width:${pr}%;background:${pColor(pr)}"></div>
        </div>
      </div>`;
  }).join('');
}

/* ═══════════ CẦN CHÚ Ý ═══════════ */
function alerts(allItems) {
  const bad = allItems
    .filter(i => i.status === 'qua_han' || i.status === 'cham_tien_do')
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'qua_han' ? -1 : 1;
      return new Date(a.end_date || 0) - new Date(b.end_date || 0);
    });

  if (!bad.length) {
    return `<div class="alert-box ok">
      <div class="ok-msg">✓ Không có hạng mục quá hạn hoặc chậm tiến độ.</div>
    </div>`;
  }

  const rows = bad.map(i => {
    const late = i.status === 'qua_han';
    const d = i.end_date ? dDiff(new Date(i.end_date), today0()) : null;
    const when = d === null ? 'chưa đặt hạn'
               : late ? `trễ ${Math.abs(d)} ngày`
               : `còn ${Math.max(d, 0)} ngày`;
    return `
      <div class="alert-row">
        <span class="badge ${late ? 'b-late' : 'b-slow'}">${late ? 'QUÁ HẠN' : 'CHẬM'}</span>
        <span class="nm">${esc(i.name)}
          <span class="sub">${esc(i.project_name || '')}${
            i.assignee ? ' · ' + esc(i.assignee) : ''}</span>
        </span>
        <span class="meta">${when} · ${Number(i.progress) || 0}%</span>
      </div>`;
  }).join('');

  return `<div class="alert-box">${rows}</div>`;
}

/* ═══════════ GANTT (cho 1 dự án) ═══════════ */
function gantt(items) {
  const rows = items.filter(i => i.start_date && i.end_date);
  if (!rows.length) return '<div class="none">Chưa đủ ngày bắt đầu / kết thúc để vẽ biểu đồ.</div>';

  let min = new Date(Math.min(...rows.map(i => +new Date(i.start_date))));
  let max = new Date(Math.max(...rows.map(i => +new Date(i.end_date))));
  min = new Date(min.getFullYear(), min.getMonth(), 1);
  max = new Date(max.getFullYear(), max.getMonth() + 1, 0);
  const span = Math.max(dDiff(max, min), 1);

  const LBL = 190, PR = 34, TOP = 22, RH = 20, W = 900;
  const H = TOP + rows.length * RH + 10;
  const cw = W - LBL - PR;
  const X = d => LBL + (dDiff(new Date(d), min) / span) * cw;

  let axis = '', cur = new Date(min);
  while (cur <= max) {
    const x = X(cur);
    axis += `<line x1="${x.toFixed(1)}" y1="${TOP - 5}" x2="${x.toFixed(1)}" y2="${H - 6}"
                   stroke="#e2e8f0" stroke-width="1"/>
             <text x="${(x + 3).toFixed(1)}" y="${TOP - 9}" font-size="9" fill="#94a3b8">
               ${cur.getMonth() + 1}/${String(cur.getFullYear()).slice(2)}</text>`;
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }

  const t = today0();
  let mark = '';
  if (t >= min && t <= max) {
    const x = X(t);
    mark = `<line x1="${x.toFixed(1)}" y1="${TOP - 5}" x2="${x.toFixed(1)}" y2="${H - 6}"
                  stroke="#ef4444" stroke-width="1.2" stroke-dasharray="3,2"/>`;
  }

  const bars = rows.map((it, k) => {
    const y = TOP + k * RH;
    const x1 = X(it.start_date), x2 = X(it.end_date);
    const w = Math.max(x2 - x1, 3);
    const st = STATUS[it.status] || STATUS.chua_bat_dau;
    const pr = Math.max(0, Math.min(100, Number(it.progress) || 0));
    const nm = it.name.length > 30 ? it.name.slice(0, 29) + '…' : it.name;
    return `
      <g>
        <text x="0" y="${y + 12}" font-size="10" fill="#334155">${esc(nm)}</text>
        <rect x="${x1.toFixed(1)}" y="${y + 3}" width="${w.toFixed(1)}" height="12" rx="3"
              fill="${st.color}" fill-opacity=".2" stroke="${st.color}" stroke-width=".8"/>
        <rect x="${x1.toFixed(1)}" y="${y + 3}" width="${(w * pr / 100).toFixed(1)}" height="12"
              rx="3" fill="${st.color}"/>
        <text x="${(x2 + 5).toFixed(1)}" y="${y + 13}" font-size="9" fill="#64748b">${pr}%</text>
      </g>`;
  }).join('');

  const used = [...new Set(rows.map(i => i.status))];
  const lg = used.map(s => {
    const st = STATUS[s] || STATUS.chua_bat_dau;
    return `<span><i style="background:${st.color}"></i>${st.label}</span>`;
  }).join('');

  return `
    <div class="gantt">
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img"
           aria-label="Biểu đồ Gantt tiến độ hạng mục">${axis}${bars}${mark}</svg>
    </div>
    <div class="glg">${lg}<span><i style="background:#ef4444"></i>Mốc hôm nay</span></div>`;
}

/* ═══════════ CHI TIẾT 1 DỰ ÁN ═══════════ */
function projectBlock(d, opt) {
  const p = d.project, items = d.items || [], s = d.summary || {};
  const disb = items.reduce((a, i) => a + (Number(i.disbursed) || 0), 0);
  const bud = Number(p.budget) || 0;

  /* Bảng hạng mục */
  const rows = items.length ? items.map((it, k) => {
    const st = STATUS[it.status] || STATUS.chua_bat_dau;
    return `<tr>
      <td class="c">${k + 1}</td>
      <td>
        <span class="nm">${esc(it.name)}</span>
        ${it.group_name || it.contractor
          ? `<span class="sub">${[it.group_name, it.contractor].filter(Boolean).map(esc).join(' · ')}</span>`
          : ''}
      </td>
      <td class="c">${esc(it.assignee || '—')}</td>
      <td class="c">${fmtDate(it.start_date)}</td>
      <td class="c">${fmtDate(it.end_date)}</td>
      <td class="c"><b>${Number(it.progress) || 0}%</b></td>
      <td class="c"><span class="st ${st.cls}">${st.label}</span></td>
      <td class="c">${deadline(it)}</td>
      <td class="r">${money(it.disbursed)}</td>
    </tr>`;
  }).join('') : '<tr><td colspan="9" class="c">Dự án chưa có hạng mục.</td></tr>';

  /* Nhật ký */
  let logHtml = '';
  if (opt.log) {
    const logs = [];
    items.forEach(it => (it.tinh_hinh || []).forEach(l =>
      logs.push({ ...l, item_name: it.name })));
    logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    logHtml = `
      <div class="sub-t">Nhật ký tình hình triển khai</div>
      ${logs.length
        ? logs.slice(0, 30).map(l => `
            <div class="log">
              <div class="lh"><b>${esc(l.item_name)}</b> · ${fmtDT(l.created_at)}</div>
              <div class="lb">${esc(l.noi_dung || '')}</div>
            </div>`).join('')
        : '<div class="none">Chưa có cập nhật tình hình.</div>'}`;
  }

  return `
    <div class="proj">
      <div class="proj-head">
        <h3>${esc(p.name)}</h3>
        ${p.code ? `<span class="code">${esc(p.code)}</span>` : ''}
      </div>

      <div class="proj-meta">
        <span>Thời gian: <b>${fmtDate(p.start_date)} → ${fmtDate(p.end_date)}</b></span>
        <span>Kinh phí: <b>${bud ? money(bud) : '—'}</b></span>
        <span>Giải ngân: <b>${money(disb)}</b>${
          bud ? ` (${Math.round(disb / bud * 100)}%)` : ''}</span>
      </div>

      <div class="mini">
        <div><b>${s.total || 0}</b><span>Hạng mục</span></div>
        <div><b style="color:var(--done)">${s.done || 0}</b><span>Hoàn thành</span></div>
        <div><b style="color:var(--prog)">${s.inprog || 0}</b><span>Đang làm</span></div>
        <div><b style="color:var(--slow)">${s.slow || 0}</b><span>Chậm</span></div>
        <div><b style="color:var(--late)">${s.overdue || 0}</b><span>Quá hạn</span></div>
      </div>

      ${opt.chart ? `<div class="sub-t">Tiến độ hạng mục (Gantt)</div>${gantt(items)}` : ''}

      <div class="sub-t">Danh sách hạng mục</div>
      <table>
        <thead><tr>
          <th style="width:32px">TT</th><th>Hạng mục</th>
          <th style="width:90px">Phụ trách</th>
          <th style="width:72px">Bắt đầu</th><th style="width:72px">Hạn</th>
          <th style="width:56px">Tiến độ</th><th style="width:92px">Trạng thái</th>
          <th style="width:80px">Thời hạn</th><th style="width:80px">Giải ngân</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>

      ${logHtml}
    </div>`;
}

/* ═══════════ DỰNG BÁO CÁO ═══════════ */
let STATS = null;      /* cache /api/stats */
const CACHE = {};      /* cache chi tiết theo id */

function options() {
  return {
    chart:  $('o-chart').checked,
    alert:  $('o-alert').checked,
    detail: $('o-detail').checked,
    log:    $('o-log').checked,
  };
}

async function build() {
  const doc = $('doc');
  const opt = options();
  const scope = $('scope').value;                 /* 'all' | id */
  const { projects, totals, byStatus, allItems } = STATS;

  const scoped = scope === 'all'
    ? projects
    : projects.filter(p => String(p.id) === String(scope));

  const scopedItems = scope === 'all'
    ? allItems
    : allItems.filter(i => String(i.project_id) === String(scope));

  /* Chỉ số — tính lại theo phạm vi đang chọn */
  const T = scope === 'all' ? totals : {
    total:     scopedItems.length,
    done:      scopedItems.filter(i => i.status === 'hoan_thanh').length,
    problem:   scopedItems.filter(i => ['qua_han','cham_tien_do'].includes(i.status)).length,
    budget:    scoped.reduce((s, p) => s + Number(p.budget || 0), 0),
    disbursed: scopedItems.reduce((s, i) => s + Number(i.disbursed || 0), 0),
  };

  const BS = scope === 'all' ? byStatus : (() => {
    const m = {};
    scopedItems.forEach(i => { m[i.status] = (m[i.status] || 0) + 1; });
    return Object.entries(m).map(([status, c]) => ({ status, c }));
  })();

  const title = scope === 'all'
    ? 'Báo cáo tổng hợp tình hình dự án'
    : `Báo cáo dự án: ${scoped[0] ? scoped[0].name : ''}`;

  /* Chi tiết dự án (tải song song, có cache) */
  let detailHtml = '';
  if (opt.detail && scoped.length) {
    doc.innerHTML = '<div class="state">Đang tải chi tiết dự án…</div>';
    const list = await Promise.all(scoped.map(async p => {
      if (!CACHE[p.id]) {
        const r = await fetch(`/api/projects/${p.id}/detail`);
        if (!r.ok) return null;
        CACHE[p.id] = await r.json();
      }
      return CACHE[p.id];
    }));
    detailHtml = `
      <section class="sec">
        <h2>Chi tiết từng dự án</h2>
        ${list.filter(Boolean).map(d => projectBlock(d, opt)).join('')
          || '<div class="none">Không tải được chi tiết dự án.</div>'}
      </section>`;
  }

  doc.innerHTML = `
    <div class="rhead">
      <img src="/logo.png" alt="">
      <div class="t">
        <h1>${esc(title)}</h1>
        <div class="sub">${esc(SITE_TEN)} — Hệ thống quản lý dự án</div>
      </div>
      <div class="when">
        Lập ngày ${fmtDate(new Date())}<br>
        ${new Date().toLocaleTimeString('vi-VN', { hour:'2-digit', minute:'2-digit' })}
      </div>
    </div>

    <section class="sec">
      <h2>Tổng quan</h2>
      <div class="kpis">
        <div class="kpi"><b>${scoped.length}</b><span>Dự án</span></div>
        <div class="kpi"><b>${T.total}</b><span>Tổng hạng mục</span></div>
        <div class="kpi k-done"><b>${T.done}</b><span>Hoàn thành</span></div>
        <div class="kpi k-prob"><b>${T.problem}</b><span>Cần chú ý</span></div>
        <div class="kpi k-money"><b>${money(T.budget)}</b><span>Tổng kinh phí</span></div>
      </div>
    </section>

    ${opt.chart ? `
    <section class="sec">
      <h2>Biểu đồ</h2>
      <div class="charts">
        <div class="card">
          <h3>Tỷ lệ theo trạng thái</h3>
          ${donut(BS)}
        </div>
        <div class="card">
          <h3>Tiến độ theo dự án</h3>
          ${projBars(scoped)}
        </div>
      </div>
    </section>` : ''}

    ${opt.alert ? `
    <section class="sec">
      <h2>Cần chú ý</h2>
      ${alerts(scopedItems)}
    </section>` : ''}

    ${detailHtml}
  `;

  document.title = title;
}

/* ═══════════ KHỞI ĐỘNG ═══════════ */
let SITE_TEN = 'Ban KHCN&CĐS';   // tên đơn vị trên tiêu đề báo cáo, lấy lại từ /api/site

(async function init() {
  const doc = $('doc');

  /* Báo cáo theo site của người đang đăng nhập (Ban KHCN&CĐS / Thác Mơ...). */
  try {
    const s = await (await fetch('/api/site')).json();
    if (s?.ten) SITE_TEN = s.ten;
  } catch { /* giữ tên mặc định */ }

  try {
    const r = await fetch('/api/stats');
    if (!r.ok) throw new Error('HTTP ' + r.status);
    STATS = await r.json();
  } catch (e) {
    doc.innerHTML = `<div class="state err">
      Không tải được dữ liệu. Kiểm tra kết nối rồi tải lại trang.
    </div>`;
    console.error(e);
    return;
  }

  /* Nạp danh sách dự án vào ô chọn phạm vi */
  const sel = $('scope');
  STATS.projects.forEach(p => {
    const o = document.createElement('option');
    o.value = p.id;
    o.textContent = p.name;
    sel.appendChild(o);
  });

  /* Nếu mở từ trang chi tiết: /report.html?id=3 → chọn sẵn dự án đó */
  const qid = new URLSearchParams(location.search).get('id');
  if (qid && STATS.projects.some(p => String(p.id) === String(qid))) sel.value = qid;

  /* Sự kiện */
  sel.onchange = build;
  ['o-chart','o-alert','o-detail','o-log'].forEach(id => { $(id).onchange = build; });
  $('btn-print').onclick = () => window.print();

  await build();
})();
