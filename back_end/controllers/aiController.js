import { GoogleGenerativeAI } from "@google/generative-ai";
import Booking from "../model/Booking.js";
import Event from "../model/Event.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const chatWithAI = async (req, res) => {
  try {
    const user = req.user;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Booking info
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

    // Event info
    const events = await Event.find().sort({ date: 1 }).limit(5);

    const eventText =
      events.length > 0
        ? events
          .map((e) => {
            const date = e.date
              ? new Date(e.date).toLocaleDateString("vi-VN")
              : "Không rõ ngày";
            return `• ${e.title} | Ngày: ${date} | Địa điểm: ${e.locationId}`;
          })
          .join("\n")
        : "Không có sự kiện.";


    // Prompt
    const prompt = `
Bạn là trợ lý TicketNow. Trả lời dựa trên dữ liệu sau:

=== USER ===
Tên: ${user.name}
Email: ${user.email}

=== VÉ ===
${bookingText}

=== SỰ KIỆN ===
${eventText}

Quy tắc:
- Trả lời bằng tiếng Việt
- Dựa 100% vào dữ liệu
- Nếu không thấy thông tin → nói "TicketNow chưa có dữ liệu về danh mục này, bạn thông cảm nhé 😢"
User hỏi: "${message}"
`;

    // ❗ MODEL MỚI (KHÔNG DÙNG MODEL CŨ)
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
