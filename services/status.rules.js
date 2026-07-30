/* ─────────────────────────────────────────────────────────────
   QUY TẮC NGHIỆP VỤ THUẦN — không SQL, không HTTP.
   Toàn bộ hàm ở đây là hàm thuần (pure): cùng input -> cùng output.
   Nhờ vậy có thể đọc/kiểm chứng độc lập với phần còn lại.
   ───────────────────────────────────────────────────────────── */

const STATUS = {
  CHUA_BAT_DAU:   'chua_bat_dau',
  DANG_THUC_HIEN: 'dang_thuc_hien',
  CHAM_TIEN_DO:   'cham_tien_do',
  QUA_HAN:        'qua_han',
  HOAN_THANH:     'hoan_thanh',
  TAM_DUNG:       'tam_dung',
};

/* Ngưỡng cảnh báo chậm tiến độ: còn <= 3 ngày mà tiến độ < 80% */
const CANH_BAO_SO_NGAY   = 3;
const CANH_BAO_TIEN_DO   = 80;
const MOT_NGAY_MS        = 86400000;

/* Suy ra trạng thái của một hạng mục dựa trên ngày tháng.
   'hoan_thanh' và 'tam_dung' là trạng thái do người dùng chốt -> giữ nguyên. */
function suyRaTrangThai(item) {
  if (item.status === STATUS.HOAN_THANH) return item.status;
  if (item.status === STATUS.TAM_DUNG)   return item.status;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = item.start_date ? new Date(item.start_date) : null;
  const end   = item.end_date   ? new Date(item.end_date)   : null;

  if (start && today < start) return STATUS.CHUA_BAT_DAU;
  if (end   && today > end)   return STATUS.QUA_HAN;

  if (end) {
    const soNgayConLai = Math.ceil((end - today) / MOT_NGAY_MS);
    if (soNgayConLai <= CANH_BAO_SO_NGAY && item.progress < CANH_BAO_TIEN_DO) {
      return STATUS.CHAM_TIEN_DO;
    }
  }
  if (start && today >= start) return STATUS.DANG_THUC_HIEN;

  return item.status;
}

/* % hoàn thành của dự án = số hạng mục hoàn thành / tổng số hạng mục.
   Mỗi hạng mục có trọng số bằng nhau, không phụ thuộc ngày tháng. */
function tinhTienDoDuAn(items) {
  if (!items.length) return 0;
  const done = items.filter(i => i.status === STATUS.HOAN_THANH).length;
  return Math.round(done / items.length * 100);
}

/* Các phép đếm dùng lại ở nhiều chỗ (dashboard, chi tiết dự án, stats) */
const demHoanThanh   = items => items.filter(i => i.status === STATUS.HOAN_THANH).length;
const demDangLam     = items => items.filter(i => i.status === STATUS.DANG_THUC_HIEN).length;
const demQuaHan      = items => items.filter(i => i.status === STATUS.QUA_HAN).length;
const demChamTienDo  = items => items.filter(i => i.status === STATUS.CHAM_TIEN_DO).length;
const demCoVanDe     = items =>
  items.filter(i => [STATUS.QUA_HAN, STATUS.CHAM_TIEN_DO].includes(i.status)).length;

const tongGiaiNgan = items => items.reduce((s, i) => s + Number(i.disbursed || 0), 0);
const tongNganSach = projects => projects.reduce((s, p) => s + Number(p.budget || 0), 0);

/* MySQL DATETIME không nhận chuỗi ISO có 'T' và 'Z' -> đổi về 'YYYY-MM-DD HH:MM:SS' */
const nowForMySQL = () => new Date().toISOString().slice(0, 19).replace('T', ' ');

module.exports = {
  STATUS,
  suyRaTrangThai, tinhTienDoDuAn,
  demHoanThanh, demDangLam, demQuaHan, demChamTienDo, demCoVanDe,
  tongGiaiNgan, tongNganSach,
  nowForMySQL,
};
