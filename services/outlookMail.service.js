/* Gửi mail nhắc nhở qua SMTP (mailbox Gmail riêng của web).
   Xem huong-phat-trien/gui-mail-nhac-nho.md mục 2 để biết cách tạo App Password.
   Chỉ chịu trách nhiệm gửi mail — không đụng DB, không biết gì về nghiệp vụ dự án. */
const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;

function layTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.MAIL_SENDER_ADDRESS,
        pass: config.MAIL_SENDER_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

/* Gửi 1 mail, danh sách người nhận (toList) và CC (ccList) là mảng email string. */
async function guiMail({ toList, ccList, subject, bodyHtml }) {
  if (!toList?.length) throw new Error('Thiếu danh sách người nhận');

  await layTransporter().sendMail({
    from:    `"PMAN - Nhắc việc dự án (không phản hồi)" <${config.MAIL_SENDER_ADDRESS}>`,
    to:      toList.join(', '),
    cc:      ccList?.length ? ccList.join(', ') : undefined,
    replyTo: config.MAIL_REPLY_TO_ADDRESS || undefined,
    subject,
    html:    bodyHtml,
  });
}

module.exports = { guiMail };
