/* TẦNG SERVICE — văn bản đính kèm (PDF, Word) của tình hình triển khai.
   File lưu trên đĩa ở uploads/tinh-hinh/ (NGOÀI thư mục public, nên chỉ
   tải được qua API có kiểm tra đăng nhập), tên file lưu là chuỗi ngẫu nhiên
   để không trùng và không lộ tên gốc; tên gốc giữ trong DB. */
const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const fileRepo     = require('../repositories/tinhHinhFile.repo');
const tinhHinhRepo = require('../repositories/tinhHinh.repo');
const audit        = require('./audit.service');
const { badRequest, notFound } = require('../utils/AppError');

const THU_MUC = path.join(__dirname, '..', 'uploads', 'tinh-hinh');
const DUNG_LUONG_TOI_DA = 20 * 1024 * 1024; // 20 MB / file

/* Đuôi file cho phép -> MIME + chữ ký đầu file (chặn đổi đuôi file lạ thành .pdf). */
const LOAI_FILE = {
  '.pdf':  { mime: 'application/pdf',    chuKy: '25504446' },         // %PDF
  '.doc':  { mime: 'application/msword', chuKy: 'd0cf11e0a1b11ae1' }, // OLE2
  '.docx': { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', chuKy: '504b0304' }, // ZIP
};

const duongDan = (tenLuu) => path.join(THU_MUC, path.basename(tenLuu));

/* Gắn danh sách file vào từng bản ghi tình hình: l.files = [...] */
async function ganFile(logs) {
  const files = await fileRepo.findByTinhHinhIds(logs.map(l => l.id));
  return logs.map(l => ({
    ...l,
    files: files
      .filter(f => f.tinh_hinh_id === l.id)
      .map(({ id, ten_goc, mime, kich_thuoc }) => ({ id, ten_goc, mime, kich_thuoc })),
  }));
}

async function tai(nguoiDung, tinhHinhId, tenGoc, buffer) {
  const log = await tinhHinhRepo.findById(tinhHinhId);
  if (!log) throw notFound('Không tìm thấy cập nhật tình hình');

  tenGoc = path.basename(String(tenGoc || '')).trim().slice(0, 255);
  const duoi = path.extname(tenGoc).toLowerCase();
  const loai = LOAI_FILE[duoi];
  if (!tenGoc || !loai) throw badRequest('Chỉ cho phép đính kèm file PDF hoặc Word (.pdf, .doc, .docx)');
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw badRequest('File rỗng');
  if (buffer.length > DUNG_LUONG_TOI_DA) throw badRequest('File vượt quá 20 MB');
  if (!buffer.subarray(0, loai.chuKy.length / 2).equals(Buffer.from(loai.chuKy, 'hex'))) {
    throw badRequest(`Nội dung file "${tenGoc}" không đúng định dạng ${duoi}`);
  }

  const tenLuu = crypto.randomBytes(16).toString('hex') + duoi;
  await fs.promises.mkdir(THU_MUC, { recursive: true });
  await fs.promises.writeFile(duongDan(tenLuu), buffer);

  const id = await fileRepo.insert({
    tinhHinhId, tenGoc, tenLuu, mime: loai.mime, kichThuoc: buffer.length,
  });
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'create', entity: 'tinh_hinh',
    entity_id: tinhHinhId, entity_name: tenGoc, detail: 'Đính kèm văn bản',
  });
  return id;
}

async function layFile(id) {
  const f = await fileRepo.findById(id);
  if (!f || !fs.existsSync(duongDan(f.ten_luu))) throw notFound('Không tìm thấy file');
  return { ...f, duongDan: duongDan(f.ten_luu) };
}

/* ── ĐỌC NỘI DUNG CHO TRỢ LÝ AI ──────────────────────────────
   - PDF : gửi nguyên file (base64) để Claude tự đọc — đọc được cả PDF scan.
   - Word: trích văn bản thuần (mammoth cho .docx, word-extractor cho .doc),
           cắt bớt nếu quá dài để không vượt giới hạn token.
   Kết quả trích Word được nhớ tạm theo tên file lưu (file không bao giờ sửa). */
const SO_KY_TU_TOI_DA = 60000;
const boNhoVanBan = new Map();

async function trichVanBanWord(f) {
  if (boNhoVanBan.has(f.ten_luu)) return boNhoVanBan.get(f.ten_luu);
  let text;
  if (path.extname(f.ten_luu).toLowerCase() === '.docx') {
    const mammoth = require('mammoth');
    text = (await mammoth.extractRawText({ path: duongDan(f.ten_luu) })).value;
  } else {
    const WordExtractor = require('word-extractor');
    text = (await new WordExtractor().extract(duongDan(f.ten_luu))).getBody();
  }
  text = String(text || '').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length > SO_KY_TU_TOI_DA) {
    text = text.slice(0, SO_KY_TU_TOI_DA) + '\n\n[... văn bản quá dài, phần còn lại đã bị lược bớt]';
  }
  if (boNhoVanBan.size >= 100) boNhoVanBan.delete(boNhoVanBan.keys().next().value);
  boNhoVanBan.set(f.ten_luu, text);
  return text;
}

/* Trả về mảng content block theo định dạng Anthropic API (dùng trong tool_result). */
async function docChoAI(id) {
  const f = await layFile(id);
  if (f.mime === 'application/pdf') {
    const data = await fs.promises.readFile(f.duongDan);
    return [{
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: data.toString('base64') },
      title: f.ten_goc,
    }];
  }
  const text = await trichVanBanWord(f);
  return [{
    type: 'text',
    text: `Văn bản "${f.ten_goc}":\n\n${text || '(Không trích được chữ nào từ file này)'}`,
  }];
}

async function xoa(nguoiDung, id) {
  const f = await fileRepo.findById(id);
  if (!f) throw notFound('Không tìm thấy file');
  await fileRepo.remove(id);
  await xoaTrenDia([f]);
  await audit.ghiNhatKy({
    user: nguoiDung, action: 'delete', entity: 'tinh_hinh',
    entity_id: f.tinh_hinh_id, entity_name: f.ten_goc, detail: 'Xóa văn bản đính kèm',
  });
}

/* Dọn file trên đĩa sau khi bản ghi DB đã bị xóa (trực tiếp hoặc do CASCADE).
   Lỗi xóa file không làm hỏng thao tác chính. */
async function xoaTrenDia(rows) {
  await Promise.all(rows.map(r =>
    fs.promises.unlink(duongDan(r.ten_luu)).catch(() => {})
  ));
}

async function xoaToanBoTrenDia() {
  await fs.promises.rm(THU_MUC, { recursive: true, force: true });
}

module.exports = {
  DUNG_LUONG_TOI_DA, ganFile, tai, layFile, docChoAI, xoa, xoaTrenDia, xoaToanBoTrenDia,
};
