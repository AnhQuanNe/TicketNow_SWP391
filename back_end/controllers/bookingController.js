import mongoose from "mongoose";
import QRCode from "qrcode";
import Booking from "../model/Booking.js";
import Event from "../model/Event.js";
import User from "../model/User.js";
import { sendTicketEmail } from "../utils/sendEmail.js";
import { createNotification } from "../controllers/notificationController.js";
import crypto from "crypto";
// ======================================================
// 1) Create Booking After Payment
// ======================================================
export const createBookingAfterPayment = async (req, res) => {
  try {
    const {
      userId,
      eventId,
      quantity,
      totalPrice,
      paymentId,
      userEmail,
      ticketType,
    } = req.body;

    if (!userId || !eventId || !quantity || !totalPrice || !paymentId || !ticketType) {
      return res.status(400).json({ message: "Thiếu thông tin đặt vé!" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId.trim());
    const eventObjectId = new mongoose.Types.ObjectId(eventId.trim());

    // Kiểm tra trùng giao dịch
    const existing = await Booking.findOne({ paymentId });
    if (existing)
      return res.status(200).json({ message: "Booking đã tồn tại", booking: existing });

    const event = await Event.findById(eventObjectId);
    if (!event) return res.status(404).json({ message: "Event không tồn tại" });

    // Trừ vé
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: eventObjectId, ticketsAvailable: { $gte: quantity } },
      { $inc: { ticketsAvailable: -quantity } },
      { new: true }
    );

    if (!updatedEvent)
      return res.status(400).json({ message: "Không đủ vé khả dụng!" });

    // Tạo booking
    const verifyToken = crypto.randomBytes(16).toString("hex");
    const newBooking = new Booking({
      userId: userObjectId,
      eventId: eventObjectId,
      quantity,
      totalPrice,
      paymentId,
      ticketType: ticketType || null,
      status: "confirmed",
        verifyToken,   // ⭐ thêm token chống giả

    });

    await newBooking.save();

    // QR Code
    const qrUrl = `http://192.168.1.117:5000/check?token=${verifyToken}`;


newBooking.qrCode = await QRCode.toDataURL(qrUrl);

    await newBooking.save();

    // Gửi email
    try {
      const user = await User.findById(userId);
      const email = user?.email || userEmail;

      if (email) {
        await sendTicketEmail(email, event, newBooking, newBooking.qrCode);
      }
    } catch (err) {
      console.error("Lỗi gửi email:", err.message);
    }

    // Notification
    try {
      const io = req.app.get("io");
      const agenda = req.app.get("agenda");

      await createNotification(
        {
          userId: newBooking.userId,
          eventId: newBooking.eventId,
          title: "Thanh toán thành công",
          message: `Bạn đã mua ${quantity} vé loại ${ticketType}.`,
        },
        io,
        agenda
      );
} catch (err) {
console.error("Lỗi thông báo:", err.message);
    }

    res.status(201).json({
      message: "Đặt vé thành công!",
      booking: newBooking,
    });
  } catch (err) {
    console.error("Lỗi tạo booking:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ======================================================
// 2) Get bookings by user
// ======================================================
export const getBookingsByUser = async (req, res) => {
  try {
    const userId = req.params.userId.trim();

    // ❗ FIX: KHÔNG populate Location nữa (vì locationId là string)
    const bookings = await Booking.find({ userId })
      .populate("eventId")   // chỉ populate Event
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Lỗi lấy vé", error: err.message });
  }
};

// ======================================================
// 3) Check-in
// ======================================================
export const checkInBooking = async (req, res) => {
  try {
    const { token } = req.body; // nhận token từ QR

    const booking = await Booking.findOne({ verifyToken: token });

    if (!booking) {
      return res.status(404).json({ message: "❌ Vé giả — token không hợp lệ!" });
    }

    if (booking.isCheckedIn) {
      return res.status(400).json({ message: "⚠ Vé đã được sử dụng trước đó!" });
    }

    booking.isCheckedIn = true;
    booking.checkInTime = new Date();
    booking.status = "checked-in";
    await booking.save();

    res.json({
      message: "✔ Check-in thành công!",
      booking,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ======================================================
// 4) Check-out
// ======================================================
export const checkOutBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Không tìm thấy vé" });

    booking.status = "checked-out";
    await booking.save();

    res.json({ message: "Check-out thành công", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Lấy danh sách booking theo event (dùng cho organizer xem danh sách attendees)
export const getBookingsByEvent = async (req, res) => {
  try {
    let { eventId } = req.params;
    if (!eventId) return res.status(400).json({ message: "Thiếu eventId" });

    eventId = eventId.trim();
    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "eventId không hợp lệ" });

    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    // pagination
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "10", 10)));
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments({ eventId: eventObjectId });
    // calculate revenue and unique buyers using aggregation
    const agg = await Booking.aggregate([
      { $match: { eventId: eventObjectId } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $ifNull: ["$totalPrice", 0] } },
          uniqueBuyers: { $addToSet: "$userId" },
        },
      },
    ]);

    const totalRevenue = agg[0]?.totalRevenue || 0;
    const uniqueBuyersCount = (agg[0]?.uniqueBuyers || []).length;

    const bookings = await Booking.find({ eventId: eventObjectId })
      .populate({ path: "userId", select: "name email" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      message: "✅ Lấy booking theo event thành công",
      count: bookings.length,
      total,
      totalRevenue,
      uniqueBuyers: uniqueBuyersCount,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      bookings,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy booking theo event:", err);
    return res.status(500).json({ message: "Lỗi khi lấy booking theo event", error: err.message });
  }
};
