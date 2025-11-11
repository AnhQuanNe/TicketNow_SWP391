import { generateQRCode } from "../utils/generateQRCode.js";
import { sendTicketEmail } from "../utils/sendEmail.js";
import Event from "../model/Event.js";
import User from "../model/User.js";

export const sendTicketEmailController = async (req, res) => {
  try {
    const { userEmail, ticket } = req.body;
    if (!userEmail || !ticket?.eventId) {
      return res.status(400).json({ message: "Thiếu thông tin email hoặc vé" });
    }

    // Lấy thông tin sự kiện (nếu cần)
    const event = await Event.findById(ticket.eventId);

    // Tạo QR code chứa thông tin check-in
    const qrData = JSON.stringify({
      userId: ticket.userId,
      eventId: ticket.eventId,
      bookingId: ticket._id || "pending",
    });
    const qrCode = await generateQRCode(qrData);

    // Gửi email
    await sendTicketEmail(userEmail, event?.title || "Sự kiện của bạn", qrCode);

    res.json({ message: "Email đã được gửi thành công!" });
  } catch (error) {
    console.error("❌ Lỗi gửi email:", error);
    res.status(500).json({ message: "Không thể gửi email vé!" });
  }
};
