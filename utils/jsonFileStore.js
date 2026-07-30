/* Helper đọc/ghi file JSON đơn giản trên đĩa — dùng cho dữ liệu nội bộ, quy mô nhỏ,
   không cần MySQL (VD: dữ liệu trang KHCN / KH SXKD, chỉ dùng riêng cho 1 ban).
   KHÔNG dùng cho dữ liệu cần nhiều người ghi đồng thời an toàn (không có khóa/transaction). */
const fs   = require('fs/promises');
const path = require('path');

/* Đọc file JSON tại filePath. Nếu file chưa tồn tại -> tạo mới với defaultValue rồi trả về. */
async function readJsonFile(filePath, defaultValue) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === 'ENOENT') {
      await writeJsonFile(filePath, defaultValue);
      return defaultValue;
    }
    throw e;
  }
}

/* Ghi đè toàn bộ nội dung file JSON tại filePath (tự tạo thư mục cha nếu chưa có). */
async function writeJsonFile(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readJsonFile, writeJsonFile };
