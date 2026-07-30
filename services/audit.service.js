/* Ghi nhật ký thao tác (audit log).
   `user` = req.session.user, hoặc null nếu do hệ thống thực hiện. */
const auditRepo = require('../repositories/audit.repo');

function ghiNhatKy({ user, action, entity, entity_id, entity_name, detail }) {
  return auditRepo.insert({
    user_id:     user ? user.id : null,
    username:    user ? user.username : 'system',
    name:        user ? user.name : 'Hệ thống',
    action,
    entity,
    entity_id:   entity_id ?? null,
    entity_name: entity_name || '',
    detail:      detail || '',
  });
}

const layNhatKyGanDay = () => auditRepo.findRecent();

module.exports = { ghiNhatKy, layNhatKyGanDay };
