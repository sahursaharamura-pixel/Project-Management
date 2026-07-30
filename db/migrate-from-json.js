/* [ĐÃ CHẠY XONG — chỉ giữ lại để tham khảo / phòng khi cần di chuyển lại]
   Di chuyển dữ liệu từ data.json (lowdb) sang MySQL.
   Chạy: node db/migrate-from-json.js
   An toàn để chạy lại: sẽ dừng nếu bảng projects trong MySQL đã có dữ liệu. */
const fs   = require('fs');
const path = require('path');
const { query, getPool } = require('./mysql');

function toMysqlDateTime(iso) {
  if (!iso) return new Date().toISOString().slice(0,19).replace('T',' ');
  return new Date(iso).toISOString().slice(0,19).replace('T',' ');
}

async function main() {
  const jsonPath = path.join(__dirname, '..', 'data.json.pre-mysql-backup');
  if (!fs.existsSync(jsonPath)) {
    console.log('Không tìm thấy data.json.pre-mysql-backup, không có gì để di chuyển.');
    process.exit(0);
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const [{ c }] = await query('SELECT COUNT(*) c FROM projects');
  if (c > 0) {
    console.log(`⚠ Bảng projects trong MySQL đã có ${c} dòng — dừng lại để tránh trùng lặp.`);
    console.log('  Nếu muốn di chuyển lại từ đầu, hãy xoá dữ liệu trong MySQL trước.');
    process.exit(1);
  }

  const projIdMap = {};
  for (const p of (data.projects||[])) {
    const r = await query(
      `INSERT INTO projects (name, code, note, start_date, end_date, budget, archived, archived_at, created_at)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [p.name, p.code||'', p.note||'', p.start_date||null, p.end_date||null, p.budget||0,
       p.archived?1:0, p.archived_at?toMysqlDateTime(p.archived_at):null, toMysqlDateTime(p.created_at)]
    );
    projIdMap[p.id] = r.insertId;
  }
  console.log(`✅ Đã chuyển ${data.projects?.length||0} dự án`);

  const itemIdMap = {};
  for (const i of (data.items||[])) {
    const newProjId = projIdMap[i.project_id];
    if (!newProjId) { console.log(`  ⚠ Bỏ qua hạng mục "${i.name}" vì không tìm thấy dự án gốc id=${i.project_id}`); continue; }
    const r = await query(
      `INSERT INTO items (project_id,name,group_name,contractor,assignee,start_date,end_date,progress,status,priority,actual_vol,disbursed,note,done_date,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [newProjId, i.name, i.group_name||'', i.contractor||'', i.assignee||'',
       i.start_date||null, i.end_date||null, i.progress||0, i.status||'chua_bat_dau', i.priority||'binh_thuong',
       i.actual_vol||'', i.disbursed||0, i.note||'', i.done_date||null,
       toMysqlDateTime(i.created_at), toMysqlDateTime(i.updated_at)]
    );
    itemIdMap[i.id] = r.insertId;
  }
  console.log(`✅ Đã chuyển ${data.items?.length||0} hạng mục`);

  let thCount = 0;
  for (const t of (data.tinh_hinh||[])) {
    const newItemId = itemIdMap[t.item_id];
    if (!newItemId) { console.log(`  ⚠ Bỏ qua tình hình id=${t.id} vì không tìm thấy hạng mục gốc id=${t.item_id}`); continue; }
    await query(
      'INSERT INTO tinh_hinh (item_id, noi_dung, created_at) VALUES (?,?,?)',
      [newItemId, t.noi_dung||'', toMysqlDateTime(t.created_at)]
    );
    thCount++;
  }
  console.log(`✅ Đã chuyển ${thCount} tình hình triển khai`);

  let archCount = 0;
  for (const a of (data.archives||[])) {
    await query(
      'INSERT INTO archives (project_id, project_json, items_json, summary_json, archived_at, archived_note) VALUES (?,?,?,?,?,?)',
      [projIdMap[a.project?.id] || 0, JSON.stringify(a.project||{}), JSON.stringify(a.items||[]), JSON.stringify(a.summary||{}),
       toMysqlDateTime(a.project?.archived_at), a.project?.archived_note || '']
    );
    archCount++;
  }
  console.log(`✅ Đã chuyển ${archCount} dự án lưu trữ`);

  const userIdMap = {};
  for (const u of (data.users||[])) {
    const r = await query(
      'INSERT INTO users (username, password_hash, name, role, disabled, must_change_password, created_at) VALUES (?,?,?,?,?,?,?)',
      [u.username, u.password_hash, u.name, u.role||'user', u.disabled?1:0, u.must_change_password?1:0, toMysqlDateTime(u.created_at)]
    );
    userIdMap[u.id] = r.insertId;
  }
  console.log(`✅ Đã chuyển ${data.users?.length||0} tài khoản`);

  let logCount = 0;
  for (const l of (data.audit_log||[])) {
    await query(
      'INSERT INTO audit_log (user_id, username, name, action, entity, entity_id, entity_name, detail, created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [userIdMap[l.user_id]||null, l.username||'system', l.name||'Hệ thống', l.action, l.entity,
       l.entity_id||null, l.entity_name||'', l.detail||'', toMysqlDateTime(l.created_at)]
    );
    logCount++;
  }
  console.log(`✅ Đã chuyển ${logCount} nhật ký`);

  console.log('\n🎉 Hoàn tất di chuyển dữ liệu sang MySQL.');
  await getPool().end();
}

main().catch(e => { console.error('❌ Lỗi di chuyển:', e); process.exit(1); });
