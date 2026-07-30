/* Bọc route handler async để lỗi (rejected promise) được chuyển tới
   Express error middleware thay vì làm crash toàn bộ server (Express 4
   không tự bắt lỗi async). */
module.exports = fn => (req, res, next) => fn(req, res, next).catch(next);
