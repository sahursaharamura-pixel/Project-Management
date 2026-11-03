/* TẦNG SERVICE — số liệu tổng hợp cho dashboard.
   Quy tắc: dự án đã lưu trữ (archived) KHÔNG tính vào thống kê hạng mục,
   nhưng ngân sách vẫn tính trên TOÀN BỘ dự án (giữ đúng hành vi cũ). */
const projectRepo  = require('../repositories/project.repo');
const itemRepo     = require('../repositories/item.repo');
const tinhHinhRepo = require('../repositories/tinhHinh.repo');
const itemService  = require('./item.service');
const rules        = require('./status.rules');
const siteService  = require('./site.service');

const SO_HANG_MUC_GAN_DAY = 10;

/* Chỉ gọi khi đã đăng nhập (route /stats có requireAuth). */
async function tongHop(nguoiDung) {
  const site = siteService.siteCua(nguoiDung);
  const projects = await projectRepo.findAll(site);

  const idDaLuuTru = new Set(projects.filter(p => p.archived).map(p => p.id));
  const duAnDangChay = projects.filter(p => !p.archived);

  /* Bỏ hạng mục của dự án đã lưu trữ, rồi đồng bộ trạng thái theo ngày. */
  let items = (await itemRepo.findAll(site)).filter(i => !idDaLuuTru.has(i.project_id));
  items = await itemService.dongBoTrangThai(items);

  /* Số liệu từng dự án */
  const projs = duAnDangChay.map(p => {
    const hangMuc = rules.hangMucChinh(items.filter(i => i.project_id === p.id));
    return {
      ...p,
      total:    hangMuc.length,
      done:     rules.demHoanThanh(hangMuc),
      overdue:  rules.demQuaHan(hangMuc),
      slow:     rules.demChamTienDo(hangMuc),
      progress: rules.tinhTienDoDuAn(hangMuc),
    };
  });

  /* Số liệu toàn hệ thống — chỉ tính hạng mục lớn, như số liệu từng dự án */
  const hangMucLon = rules.hangMucChinh(items);
  const totals = {
    total:     hangMucLon.length,
    done:      rules.demHoanThanh(hangMucLon),
    problem:   rules.demCoVanDe(hangMucLon),
    budget:    rules.tongNganSach(projects),   // tính cả dự án đã lưu trữ
    disbursed: rules.tongGiaiNgan(hangMucLon),
  };

  /* Phân bố theo trạng thái */
  const dem = {};
  hangMucLon.forEach(i => { dem[i.status] = (dem[i.status] || 0) + 1; });
  const byStatus = Object.entries(dem).map(([status, c]) => ({ status, c }));

  const tenDuAn = Object.fromEntries(projects.map(p => [p.id, p.name]));

  /* Hạng mục vừa cập nhật gần đây nhất */
  const recent = [...items]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, SO_HANG_MUC_GAN_DAY)
    .map(i => ({ ...i, project_name: tenDuAn[i.project_id] || '' }));

  /* Toàn bộ hạng mục, kèm bản tin tình hình mới nhất của mỗi hạng mục */
  const tinhHinhAll = await tinhHinhRepo.findAll(site);
  const tenHangMuc = Object.fromEntries(items.map(i => [i.id, i.name]));
  const allItems = items.map(i => {
    const cuaHangMuc = tinhHinhAll
      .filter(l => l.item_id === i.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return {
      ...i,
      project_name:  tenDuAn[i.project_id] || '',
      parent_name:   i.parent_id ? (tenHangMuc[i.parent_id] || '') : '',
      tinh_hinh_moi: cuaHangMuc[0] || null,
    };
  });

  return { projects: projs, totals, byStatus, recent, allItems };
}

module.exports = { tongHop };
