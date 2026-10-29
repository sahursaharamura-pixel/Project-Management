/* TẦNG SERVICE — trợ lý AI phân tích dự án.
   Gồm 2 phần tách bạch:
     1. gomNguCanh()  — lấy & tóm tắt dữ liệu dự án (gọn để tiết kiệm token)
     2. hoiClaude()   — gọi Anthropic API; Claude có công cụ doc_van_ban để tự
                        mở văn bản PDF/Word đính kèm tình hình triển khai khi cần

   THAY ĐỔI KỸ THUẬT so với bản cũ: dùng fetch (có sẵn từ Node 18) thay cho
   https.request dạng callback. Lý do: callback nằm trong async handler nên lỗi
   KHÔNG được asyncHandler bắt -> có thể làm treo request. Dùng fetch/await thì
   lỗi chảy đúng về middleware xử lý lỗi. Nội dung request và mọi thông báo lỗi
   trả về cho client giữ NGUYÊN như cũ. */
const projectRepo  = require('../repositories/project.repo');
const itemRepo     = require('../repositories/item.repo');
const tinhHinhRepo = require('../repositories/tinhHinh.repo');
const archiveRepo  = require('../repositories/archive.repo');
const fileRepo     = require('../repositories/tinhHinhFile.repo');
const fileService  = require('./tinhHinhFile.service');
const rules        = require('./status.rules');
const siteService  = require('./site.service');
const { badRequest, AppError } = require('../utils/AppError');

const API_URL      = 'https://api.anthropic.com/v1/messages';
const API_VERSION  = '2023-06-01';
const MODEL        = 'claude-haiku-4-5-20251001';
const MAX_TOKENS   = 1024;
const SO_TIN_TINH_HINH = 3;   // mỗi dự án gửi kèm 3 bản tin tình hình mới nhất
const SO_VONG_TOI_DA   = 5;   // số lượt tối đa Claude được gọi công cụ đọc văn bản / 1 câu hỏi

/* Công cụ cho Claude tự mở văn bản đính kèm (PDF, Word) của tình hình triển khai
   khi câu hỏi cần tới nội dung file — không gửi sẵn mọi file để tiết kiệm token. */
const CONG_CU = [{
  name: 'doc_van_ban',
  description: 'Đọc toàn bộ nội dung một văn bản (PDF/Word) đính kèm trong tình hình triển khai. '
             + 'Dùng khi câu hỏi liên quan tới nội dung văn bản; file_id lấy từ mục van_ban_dinh_kem trong DỮ LIỆU.',
  input_schema: {
    type: 'object',
    properties: { file_id: { type: 'integer', description: 'file_id của văn bản cần đọc' } },
    required: ['file_id'],
  },
}];

const loi = (msg) => new AppError(500, msg);

/* Key chưa cấu hình -> báo rõ ràng, thay vì để API trả lỗi thô khó hiểu. */
function kiemTraApiKey(apiKey) {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || !apiKey.startsWith('sk-ant-')) {
    throw loi('Chatbot chưa được cấu hình: CLAUDE_API_KEY trong config.js đang là key mẫu. '
            + 'Hãy điền key thật (bắt đầu bằng sk-ant-) rồi khởi động lại ứng dụng.');
  }
}

/* ── GOM & TÓM TẮT DỮ LIỆU ────────────────────────────────── */
/* Chỉ gom dữ liệu của site đang làm việc -> trợ lý AI không thấy dự án site khác. */
async function gomNguCanh(site) {
  const [projects, items, tinhHinh, archives, vanBan] = await Promise.all([
    projectRepo.findAllActive(site),
    itemRepo.findAll(site),
    tinhHinhRepo.findAll(site),
    archiveRepo.findIds(site),
    fileRepo.findAllKemHangMuc(site),
  ]);

  const tomTat = projects.map(p => {
    const hangMuc = items.filter(i => i.project_id === p.id);
    const idHangMuc = new Set(hangMuc.map(i => i.id));

    const tinMoiNhat = tinhHinh
      .filter(t => idHangMuc.has(t.item_id))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, SO_TIN_TINH_HINH);

    return {
      id: p.id, name: p.name, code: p.code,
      start_date: p.start_date, end_date: p.end_date,
      budget: p.budget,
      stats: {
        total:   hangMuc.length,
        done:    rules.demHoanThanh(hangMuc),
        inprog:  rules.demDangLam(hangMuc),
        overdue: rules.demQuaHan(hangMuc),
        slow:    rules.demChamTienDo(hangMuc),
      },
      items: hangMuc.map(i => ({
        name: i.name, status: i.status,
        start_date: i.start_date, end_date: i.end_date,
        assignee: i.assignee, group_name: i.group_name,
        note: i.note,
      })),
      tinh_hinh_gan_nhat: tinMoiNhat.map(t => ({
        noi_dung: t.noi_dung,
        created_at: t.created_at,
        item_name: hangMuc.find(i => i.id === t.item_id)?.name || '',
      })),
      van_ban_dinh_kem: vanBan
        .filter(f => f.project_id === p.id)
        .map(f => ({
          file_id: f.id, ten: f.ten_goc, created_at: f.created_at,
          item_name: hangMuc.find(i => i.id === f.item_id)?.name || '',
        })),
    };
  });

  /* Chỉ cho phép đọc văn bản thuộc các dự án đang hoạt động đã liệt kê ở trên. */
  const fileIdHopLe = new Set(tomTat.flatMap(p => p.van_ban_dinh_kem.map(f => f.file_id)));

  return { tomTat, soDuAnLuuTru: archives.length, fileIdHopLe };
}

function taoSystemPrompt({ tomTat, soDuAnLuuTru }) {
  const today = new Date().toLocaleDateString('vi-VN');
  return `Bạn là trợ lý AI phân tích dự án. Hôm nay ${today}.

DỮ LIỆU:
${JSON.stringify(tomTat, null, 2)}
Dự án đã lưu trữ: ${soDuAnLuuTru}

QUY TẮC TRẢ LỜI (bắt buộc tuân thủ):
- Chỉ trả lời đúng nội dung được hỏi, không thêm thông tin ngoài phạm vi câu hỏi, không suy diễn rộng ra các việc khác không được hỏi tới
- Trả lời thẳng vào câu hỏi, đúng trọng tâm — không chào hỏi, không mở đầu kiểu "Chào bạn", "Tôi thấy rằng", không có câu dẫn hay câu kết thừa, không tóm tắt lại câu hỏi
- Ngắn gọn, súc tích, tối đa 150 từ trừ khi được yêu cầu chi tiết
- Dùng số liệu cụ thể, không nói chung chung
- TUYỆT ĐỐI KHÔNG vẽ bảng markdown (không dùng ký tự |, không kẻ bảng) vì khung chat rất hẹp, bảng sẽ vỡ layout — thay vào đó liệt kê từng dòng theo dạng "Tên: giá trị" hoặc gạch đầu dòng
- Nếu liệt kê nhiều hơn 2 mục thì dùng gạch đầu dòng (-), mỗi mục 1 dòng ngắn
- Khi cần nhấn mạnh tên công việc/hạng mục ở đầu dòng, in đậm ĐÚNG phần tên đó bằng cú pháp **tên** (không để lẫn dấu ** ra ngoài chuỗi in đậm, không in đậm cả câu)
- Không dùng heading #
- Không bịa thêm thông tin ngoài dữ liệu đã cho
- Mục van_ban_dinh_kem chỉ có TÊN văn bản. Khi câu hỏi cần nội dung văn bản (nội dung, số liệu, kết luận, tóm tắt...), PHẢI gọi công cụ doc_van_ban với file_id tương ứng để đọc trước khi trả lời; khi trả lời dựa vào văn bản thì nêu tên văn bản làm nguồn`;
}

/* Dịch mã lỗi của Anthropic sang thông báo tiếng Việt dễ hiểu. */
function dichLoiAPI(err) {
  if (err.type === 'authentication_error' || err.type === 'permission_error') {
    return 'API key Claude không hợp lệ hoặc đã bị thu hồi. Kiểm tra CLAUDE_API_KEY trong config.js.';
  }
  if (err.type === 'rate_limit_error') {
    return 'Vượt giới hạn gọi API, thử lại sau ít phút.';
  }
  return err.message;
}

/* ── GỌI CLAUDE API ───────────────────────────────────────── */
async function hoiClaude(apiKey, cauHoi, nguoiDung) {
  if (!cauHoi) throw badRequest('Thiếu câu hỏi');
  kiemTraApiKey(apiKey);

  const nguCanh = await gomNguCanh(siteService.siteCua(nguoiDung));
  const system  = taoSystemPrompt(nguCanh);
  const messages = [{ role: 'user', content: cauHoi }];

  for (let vong = 0; ; vong++) {
    const parsed = await goiAPI(apiKey, {
      model:      MODEL,
      max_tokens: MAX_TOKENS,
      system,
      messages,
      /* Hết lượt đọc văn bản -> không đưa công cụ nữa, buộc Claude trả lời luôn. */
      ...(vong < SO_VONG_TOI_DA ? { tools: CONG_CU } : {}),
    });

    if (parsed.stop_reason !== 'tool_use') {
      const text = (parsed.content || [])
        .filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
      return text || 'Không có phản hồi';
    }

    messages.push({ role: 'assistant', content: parsed.content });
    const ketQua = await Promise.all(parsed.content
      .filter(b => b.type === 'tool_use')
      .map(b => chayCongCu(b, nguCanh.fileIdHopLe)));
    messages.push({ role: 'user', content: ketQua });
  }
}

/* Thực thi 1 lời gọi công cụ doc_van_ban -> tool_result. Lỗi đọc file trả lại
   cho Claude (is_error) để nó báo cho người dùng, không làm hỏng cả câu hỏi. */
async function chayCongCu(block, fileIdHopLe) {
  const ketQua = (content, isError) => ({
    type: 'tool_result', tool_use_id: block.id, content, ...(isError ? { is_error: true } : {}),
  });
  const fileId = Number(block.input?.file_id);
  if (block.name !== 'doc_van_ban' || !fileIdHopLe.has(fileId)) {
    return ketQua('Không tìm thấy văn bản với file_id này', true);
  }
  try {
    return ketQua(await fileService.docChoAI(fileId));
  } catch (e) {
    return ketQua(`Không đọc được văn bản: ${e.message}`, true);
  }
}

async function goiAPI(apiKey, body) {
  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    /* Không nối được tới api.anthropic.com (mất mạng, firewall chặn...) */
    throw loi(e.message);
  }

  let parsed;
  try {
    parsed = await res.json();
  } catch {
    throw loi('Lỗi phân tích phản hồi');
  }

  if (parsed.error) throw loi(dichLoiAPI(parsed.error));
  return parsed;
}

module.exports = { hoiClaude, gomNguCanh };
