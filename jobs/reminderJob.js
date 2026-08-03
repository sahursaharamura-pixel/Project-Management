/* Đăng ký lịch chạy nhắc nhở định kỳ: thứ 2 và thứ 5, 9h00 sáng giờ VN.
   Lưu ý (xem huong-phat-trien/gui-mail-nhac-nho.md mục 5): app chạy trên
   iisnode có thể bị idle-recycle, làm cron trong tiến trình bỏ lỡ lịch.
   Nếu gặp tình trạng đó, chuyển sang dùng route /api/internal/reminders/run
   (routes/api.js) qua Windows Task Scheduler thay vì gọi batDauLich() này. */
const cron = require('node-cron');
const reminderService = require('../services/reminder.service');

function batDauLich() {
  cron.schedule('0 9 * * 1,4', async () => {
    try {
      await reminderService.guiNhacNhoDinhKy();
    } catch (e) {
      console.error('[reminderJob] Lỗi gửi nhắc nhở định kỳ:', e.message);
    }
  }, { timezone: 'Asia/Ho_Chi_Minh' });

  console.log('🕐 Đã đăng ký lịch nhắc nhở: Thứ 2 & Thứ 5, 9h00 (giờ VN)');
}

module.exports = { batDauLich };
