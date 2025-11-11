import mongoose from "mongoose";
import QRCode from "qrcode";
import Booking from "../model/Booking.js";
import Event from "../model/Event.js";
import User from "../model/User.js";
import { sendTicketEmail } from "../utils/sendEmail.js"; // bản chuẩn Gmail App Password

export const createBookingAfterPayment = async (req, res) => {
  try {
    const { userId, eventId, quantity, totalPrice, paymentId } = req.body;

    if (!userId || !eventId || !quantity || !totalPrice) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId.trim());
    const eventObjectId = new mongoose.Types.ObjectId(eventId.trim());

    const event = await Event.findById(eventObjectId);
    if (!event) return res.status(404).json({ message: "Event không tồn tại" });

    if (event.ticketsAvailable < quantity) {
      return res.status(400).json({ message: "Không đủ vé khả dụng" });
    }

    // Trừ vé
    await Event.findByIdAndUpdate(eventObjectId, { $inc: { ticketsAvailable: -quantity } });

    // Kiểm tra booking trùng theo paymentId
    const existingBooking = await Booking.findOne({ paymentId });
    if (existingBooking) {
      return res.status(200).json({ message: "Vé đã tồn tại", booking: existingBooking });
    }

    // Tạo booking mới
    const newBooking = new Booking({
      userId: userObjectId,
      eventId: eventObjectId,
      quantity,
      totalPrice,
      paymentId,
      status: "confirmed",
    });

    await newBooking.save();
    console.log("✅ Booking lưu thành công:", newBooking._id);

    // --- Tạo QR code ---
    try {
      const qrData = {
        bookingId: newBooking._id,
        userId,
        eventId,
      };
      const qrImage = await QRCode.toDataURL(JSON.stringify(qrData));
      newBooking.qrCode = qrImage;
      await newBooking.save();
      console.log("✅ QR code đã lưu");
    } catch (qrErr) {
      console.error("❌ Lỗi tạo QR code:", qrErr.message);
    }

    // --- Gửi email ---
    try {
      const user = await User.findById(userId);
      if (user?.email) {
        await sendTicketEmail(user.email, newBooking, newBooking.qrCode);
        console.log("📧 Email vé đã gửi");
      } else {
        console.warn("⚠️ Không tìm thấy email người dùng, bỏ qua gửi email");
      }
    } catch (emailErr) {
      console.error("❌ Lỗi gửi email:", emailErr.message);
    }

    return res.status(201).json({
      message: "🎟️ Đặt vé thành công (QR + email tách try/catch riêng)",
      booking: newBooking,
    });
  } catch (err) {
    console.error("❌ Lỗi chung khi tạo booking:", err.message);
    return res.status(500).json({ message: "Lỗi khi lưu booking", error: err.message });
  }
};


// ✅ Lấy danh sách vé của user
export const getBookingsByUser = async (req, res) => {
  try {
    let { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Thiếu userId" });

    userId = userId.trim();
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "userId không hợp lệ" });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const bookings = await Booking.find({ userId: userObjectId })
      .populate({
        path: "eventId",
        populate: { path: "locationId", model: "Location", select: "name address" },
        select: "title date locationId image ticketsAvailable",
      })
      .sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(404).json({ message: "Không tìm thấy vé nào" });
    }

    return res.status(200).json({
      message: "✅ Lấy danh sách vé thành công",
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy vé theo user:", err);
    return res.status(500).json({ message: "Lỗi khi lấy vé", error: err.message });
  }
};

// ✅ Check-in bằng mã QR
export const checkInBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "Thiếu bookingId" });

    const booking = await Booking.findById(bookingId).populate("eventId");
    if (!booking) return res.status(404).json({ message: "Không tìm thấy vé" });
    if (booking.status === "checked-in")
      return res.status(400).json({ message: "Vé đã được check-in trước đó" });

    booking.status = "checked-in";
    await booking.save();

    return res.status(200).json({ message: "✅ Check-in thành công!", booking });
  } catch (error) {
    console.error("❌ Lỗi check-in:", error);
    return res.status(500).json({ message: "Lỗi check-in vé", error: error.message });
  }
};

// ✅ Check-out (rời sự kiện)
export const checkOutBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "Thiếu bookingId" });

    const booking = await Booking.findById(bookingId).populate("eventId");
    if (!booking) return res.status(404).json({ message: "Không tìm thấy vé" });
    if (booking.status !== "checked-in")
      return res.status(400).json({ message: "Vé chưa check-in, không thể check-out" });

    booking.status = "checked-out";
    await booking.save();

    return res.status(200).json({ message: "✅ Check-out thành công!", booking });
  } catch (error) {
    console.error("❌ Lỗi check-out:", error);
    return res.status(500).json({ message: "Lỗi check-out vé", error: error.message });
  }
};
