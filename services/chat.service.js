/* TẦNG SERVICE — trợ lý AI phân tích dự án.
   Gồm 2 phần tách bạch:
     1. gomNguCanh()  — lấy & tóm tắt dữ liệu dự án (gọn để tiết kiệm token)
     2. hoiClaude()   — gọi Anthropic API

   THAY ĐỔI KỸ THUẬT so với bản cũ: dùng fetch (có sẵn từ Node 18) thay cho
   https.request dạng callback. Lý do: callback nằm trong async handler nên lỗi
   KHÔNG được asyncHandler bắt -> có thể làm treo request. Dùng fetch/await thì
   lỗi chảy đúng về middleware xử lý lỗi. Nội dung request và mọi thông báo lỗi
   trả về cho client giữ NGUYÊN như cũ. */
const projectRepo  = require('../repositories/project.repo');
const itemRepo     = require('../repositories/item.repo');
const tinhHinhRepo = require('../repositories/tinhHinh.repo');
const archiveRepo  = require('../repositories/archive.repo');
const rules        = require('./status.rules');
const { badRequest, AppError } = require('../utils/AppError');

const API_URL      = 'https://api.anthropic.com/v1/messages';
const API_VERSION  = '2023-06-01';
const MODEL        = 'claude-haiku-4-5-20251001';
const MAX_TOKENS   = 1024;
const SO_TIN_TINH_HINH = 3;   // mỗi dự án gửi kèm 3 bản tin tình hình mới nhất

const loi = (msg) => new AppError(500, msg);

/* Key chưa cấu hình -> báo rõ ràng, thay vì để API trả lỗi thô khó hiểu. */
function kiemTraApiKey(apiKey) {
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE' || !apiKey.startsWith('sk-ant-')) {
    throw loi('Chatbot chưa được cấu hình: CLAUDE_API_KEY trong config.js đang là key mẫu. '
            + 'Hãy điền key thật (bắt đầu bằng sk-ant-) rồi khởi động lại ứng dụng.');
  }
}

/* ── GOM & TÓM TẮT DỮ LIỆU ────────────────────────────────── */
async function gomNguCanh() {
  const [projects, items, tinhHinh, archives] = await Promise.all([
    projectRepo.findAllActive(),
    itemRepo.findAll(),
    tinhHinhRepo.findAll(),
    archiveRepo.findIds(),
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
    };
  });

  return { tomTat, soDuAnLuuTru: archives.length };
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
- Không bịa thêm thông tin ngoài dữ liệu đã cho`;
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
async function hoiClaude(apiKey, cauHoi) {
  if (!cauHoi) throw badRequest('Thiếu câu hỏi');
  kiemTraApiKey(apiKey);

  const nguCanh = await gomNguCanh();

  let res;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: MAX_TOKENS,
        system:     taoSystemPrompt(nguCanh),
        messages:   [{ role: 'user', content: cauHoi }],
      }),
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

  return parsed.content?.[0]?.text || 'Không có phản hồi';
}

module.exports = { hoiClaude, gomNguCanh };
