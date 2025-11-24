import { GoogleGenerativeAI } from "@google/generative-ai";
import Booking from "../model/Booking.js";
import Event from "../model/Event.js";
import Category from "../model/Category.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chatWithAI = async (req, res) => {
  try {
    const user = req.user;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const lowerMsg = message.toLowerCase().trim();

    // =====================================================
    // 1️⃣ NHẬN DIỆN DỮ LIỆU NGƯỜI DÙNG MUỐN TÌM
    // =====================================================

    // ➤ Detect tháng
    const monthMatch = lowerMsg.match(/tháng\s*(\d{1,2})|thang\s*(\d{1,2})/);
    const month = monthMatch ? Number(monthMatch[1] || monthMatch[2]) : null;

    // ➤ Detect địa điểm
    const locationKeywords = [
      "đà nẵng", "da nang",
      "fpt", "fptu",
      "quảng trường", "quang truong",
      "sân bóng", "san bong",
      "hội trường", "hoi truong",
      "tòa alpha", "toa alpha", "alpha"
    ];
    const detectedLocation = locationKeywords.find((w) =>
      lowerMsg.includes(w)
    );

    // ➤ Detect thể loại (category)
    const categories = await Category.find();
    let selectedCategory = null;

    for (const c of categories) {
      if (lowerMsg.includes(c.name.toLowerCase())) {
        selectedCategory = c._id;
        break;
      }
    }

    // ➤ Detect từ khóa title (KHÔNG cho phép override nếu user hỏi tháng)
    let searchKeyword = null;

    if (!month && !selectedCategory && !detectedLocation) {
      const ignoreWords = [
        "tháng", "thang", "có", "co",
        "sự kiện", "su kien", "gì", "gi",
        "không", "khong", "ở", "tai"
      ];

      const words = lowerMsg.split(" ").filter(w => w.length > 2);
      const valid = words.filter(w => !ignoreWords.includes(w));

      if (valid.length > 0) {
        searchKeyword = valid.join(" ");
      }
    }

    // =====================================================
    // 2️⃣ XÂY DỰNG QUERY TÌM SỰ KIỆN (KHÔNG GHI ĐÈ NHAU)
    // =====================================================

    let query = {};

    if (selectedCategory) query.categoryId = selectedCategory;
    if (detectedLocation)
      query.locationId = { $regex: new RegExp(detectedLocation, "i") };

    if (month) {
      // lấy năm trực tiếp từ dữ liệu tháng mà user hỏi
      query.date = {
        $gte: new Date(`2025-${month}-01`),
        $lte: new Date(`2025-${month}-31`)
      };
    }

    if (searchKeyword) {
      query.title = { $regex: new RegExp(searchKeyword, "i") };
    }

    const events = await Event.find(query).sort({ date: 1 });

    const eventText =
      events.length > 0
        ? events
            .map((e) => {
              const dateString = e.date
                ? new Date(e.date).toLocaleDateString("vi-VN")
                : "Không rõ ngày";
              return `• ${e.title} | Ngày: ${dateString} | Địa điểm: ${e.locationId}`;
            })
            .join("\n")
        : "TicketNow chưa có dữ liệu phù hợp với yêu cầu của bạn.";

    // =====================================================
    // 3️⃣ BOOKING CỦA USER
    // =====================================================

    const bookings = await Booking.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .populate("eventId", "title startDate venue");

    const bookingText =
      bookings.length > 0
        ? bookings
            .map(
              (b) =>
                `• ${b.eventId?.title} | SL: ${b.quantity} | Loại: ${b.ticketType} | QR: ${b.qrToken}`
            )
            .join("\n")
        : "Không có vé nào.";

    // =====================================================
    // 4️⃣ PROMPT
    // =====================================================

    const prompt = `
Dưới đây là dữ liệu sự kiện từ TicketNow. Hãy trả lời đúng 100% theo dữ liệu:

=== USER ===
Tên: ${user.name}
Email: ${user.email}

=== VÉ ===
${bookingText}

=== KẾT QUẢ SỰ KIỆN ===
${eventText}

QUY TẮC:
- Trả lời bằng tiếng Việt.
- Không tự bịa dữ liệu.
- Nếu không có sự kiện, hãy gợi ý loại sự kiện khác để user chọn.

User hỏi: "${message}"
`;

    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });

  } catch (err) {
    console.error("Gemini AI error:", err);
    res.status(500).json({ message: "Gemini error", error: err.message });
  }
};
