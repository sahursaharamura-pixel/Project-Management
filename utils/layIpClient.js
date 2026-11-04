/* Lấy IP thật của client, ưu tiên X-Forwarded-For (khi qua IIS/reverse proxy),
   bỏ tiền tố ::ffff: của địa chỉ IPv4-mapped-IPv6 cho gọn. */
function layIpClient(req) {
  const xff = req.headers['x-forwarded-for'];
  let ip = (xff ? xff.split(',')[0].trim() : null) || req.ip || req.socket?.remoteAddress || '';
  if (ip.startsWith('::ffff:')) ip = ip.slice(7);
  return ip || 'Không xác định';
}

module.exports = layIpClient;
