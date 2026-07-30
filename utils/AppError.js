/* Lỗi nghiệp vụ có kèm mã HTTP.
   Nhờ lớp này, tầng service có thể báo lỗi mà KHÔNG cần biết tới req/res.
   Middleware xử lý lỗi ở server.js sẽ dịch nó thành response.

   Body trả về cho client GIỮ NGUYÊN như cũ: { error: "..." } */
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name   = 'AppError';
    this.status = status;
  }
}

const badRequest   = msg => new AppError(400, msg);
const unauthorized = msg => new AppError(401, msg);
const forbidden    = msg => new AppError(403, msg);
const notFound     = msg => new AppError(404, msg);

module.exports = { AppError, badRequest, unauthorized, forbidden, notFound };
