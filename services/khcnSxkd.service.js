/* TẦNG SERVICE — dữ liệu trang "Định hướng KHCN" và "KH SXKD".
   Theo yêu cầu: 2 trang này phục vụ riêng Ban KHCN&CĐS, không áp dụng cho toàn bộ hệ
   thống, nên KHÔNG lưu vào MySQL mà lưu ở 2 file JSON riêng trên đĩa server
   (data/khcn-data.json, data/sxkd-data.json). Đơn giản, dễ backup (copy file),
   không cần schema/migration. Đánh đổi: không khoá ghi đồng thời, không có audit log
   chi tiết như phần dự án chính — chấp nhận được vì quy mô sử dụng nhỏ, nội bộ 1 ban. */
const path = require('path');
const { readJsonFile, writeJsonFile } = require('../utils/jsonFileStore');
const { badRequest } = require('../utils/AppError');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const KHCN_FILE = path.join(DATA_DIR, 'khcn-data.json');
const SXKD_FILE = path.join(DATA_DIR, 'sxkd-data.json');

const KHCN_EMPTY = { groups: [], items: [] };
const SXKD_EMPTY = { tscd: [], cphd: [], doichieu: [] };

async function getKhcn() {
  return readJsonFile(KHCN_FILE, KHCN_EMPTY);
}

async function saveKhcn(payload) {
  if (!payload || !Array.isArray(payload.groups) || !Array.isArray(payload.items)) {
    throw badRequest('Dữ liệu KHCN không hợp lệ (thiếu groups/items dạng mảng)');
  }
  await writeJsonFile(KHCN_FILE, { groups: payload.groups, items: payload.items });
}

async function getSxkd() {
  return readJsonFile(SXKD_FILE, SXKD_EMPTY);
}

async function saveSxkd(payload) {
  if (!payload || !Array.isArray(payload.tscd) || !Array.isArray(payload.cphd) || !Array.isArray(payload.doichieu)) {
    throw badRequest('Dữ liệu SXKD không hợp lệ (thiếu tscd/cphd/doichieu dạng mảng)');
  }
  await writeJsonFile(SXKD_FILE, { tscd: payload.tscd, cphd: payload.cphd, doichieu: payload.doichieu });
}

module.exports = { getKhcn, saveKhcn, getSxkd, saveSxkd };
