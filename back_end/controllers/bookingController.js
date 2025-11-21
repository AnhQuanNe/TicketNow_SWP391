import mongoose from "mongoose";
import QRCode from "qrcode";
import Booking from "../model/Booking.js";
import Event from "../model/Event.js";
import User from "../model/User.js";
import { sendTicketEmail } from "../utils/sendEmail.js";
import { createNotification } from "../controllers/notificationController.js";
import crypto from "crypto";

// ======================================================
// 1) Create Booking After Payment (multi-ticket + canceled)
// ======================================================
export const createBookingAfterPayment = async (req, res) => {
  try {
    const { userId, eventId, tickets, paymentId, userEmail, paymentStatus } = req.body;

    if (!userId || !eventId || !tickets || !Array.isArray(tickets) || tickets.length === 0) {
      return res.status(400).json({ message: "Thiếu dữ liệu vé!" });
    }

    const userObj = new mongoose.Types.ObjectId(userId.trim());
    const eventObj = new mongoose.Types.ObjectId(eventId.trim());

    const event = await Event.findById(eventObj);
    if (!event) return res.status(404).json({ message: "Không tìm thấy event!" });

    let createdBookings = [];

    for (const tic of tickets) {
      for (let i = 0; i < tic.quantity; i++) {
        const updatedEvent = await Event.findOneAndUpdate(
          { _id: eventObj, ticketsAvailable: { $gte: 1 } },
          { $inc: { ticketsAvailable: -1 } },
          { new: true }
        );

        if (!updatedEvent)
          return res.status(400).json({ message: "Không đủ vé khả dụng!" });

        const verifyToken = crypto.randomBytes(16).toString("hex");

        const booking = new Booking({
          userId: userObj,
          eventId: eventObj,
          quantity: 1,
          totalPrice: tic.price,
          ticketType: tic.type,
          paymentId: `${paymentId}_${tic.type}_${i}`,
          status: paymentStatus === "PAYMENT_CANCELED" ? "canceled" : "confirmed",
          verifyToken,
        });

        const qrUrl = `http://10.12.80.56:5000/api/bookings/check?token=${verifyToken}&eventId=${eventObj.toString()}`;
        booking.qrCode = await QRCode.toDataURL(qrUrl);

        await booking.save();
        createdBookings.push(booking);
      }
    }

    // Gửi email từng vé
    try {
      const user = await User.findById(userId);
      const emailToSend = user?.email || userEmail;

      if (emailToSend && paymentStatus !== "PAYMENT_CANCELED") {
        for (const b of createdBookings) {
          await sendTicketEmail(emailToSend, event, b, b.qrCode);
        }
      }
    } catch (err) {
      console.error("Lỗi gửi email:", err.message);
    }

    // Gửi thông báo thanh toán
    try {
      const io = req.app.get("io");
      const agenda = req.app.get("agenda");

      await createNotification(
        {
          userId,
          eventId,
          title: paymentStatus === "PAYMENT_CANCELED" ? "Thanh toán bị hủy" : "Thanh toán thành công",
          message:
            paymentStatus === "PAYMENT_CANCELED"
              ? "Giao dịch đã bị hủy, vé đã hủy."
              : `Bạn đã mua: ${tickets.map((t) => `${t.type} x${t.quantity}`).join(", ")}`,
        },
        io,
        agenda
      );
    } catch (err) {
      console.error("Lỗi thông báo:", err.message);
    }

    // Nhắc sự kiện trước 1 giờ
    try {
      const io = req.app.get("io");
      const agenda = req.app.get("agenda");

      if (event?.date && paymentStatus !== "PAYMENT_CANCELED") {
        const startTime = new Date(event.date);
        const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);

        if (oneHourBefore > new Date()) {
          await createNotification(
            {
              userId,
              eventId,
              title: "Nhắc nhở sự kiện",
              message: `Sự kiện '${event.title}' sẽ bắt đầu trong 1 giờ.`,
              scheduledFor: oneHourBefore,
            },
            io,
            agenda
          );
        }
      }
    } catch (err) {
      console.error("Lỗi tạo nhắc sự kiện:", err.message);
    }

    return res.status(201).json({
      message: paymentStatus === "PAYMENT_CANCELED" ? "Tạo vé (canceled)" : "Đặt vé thành công!",
      bookings: createdBookings,
    });
  } catch (err) {
    console.error("Lỗi createBooking:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// ======================================================
// 2) Get bookings by user
// ======================================================
export const getBookingsByUser = async (req, res) => {
  try {
    const userId = req.params.userId.trim();

    const bookings = await Booking.find({ userId })
      .populate("eventId")
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
    const { token, eventId } = req.body;

    const booking = await Booking.findOne({ verifyToken: token });
    if (!booking) {
      return res.status(404).json({ message: "❌ Vé giả — token không hợp lệ!" });
    }

    if (booking.eventId.toString() !== eventId) {
      return res.status(400).json({ message: "❌ Token không thuộc về sự kiện này!" });
    }

    if (booking.isCheckedIn) {
      return res.status(400).json({ message: "⚠ Vé đã được sử dụng!" });
    }

    booking.isCheckedIn = true;
    booking.checkInTime = new Date();
    booking.status = "checked-in";
    await booking.save();

    res.json({ message: "✔ Check-in thành công!", booking });
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

// ======================================================
// 5) getBookingsByEvent (⭐ analytics đầy đủ)
// ======================================================
export const getBookingsByEvent = async (req, res) => {
  try {
    let { eventId } = req.params;
    if (!eventId) return res.status(400).json({ message: "Thiếu eventId" });

    eventId = eventId.trim();
    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ message: "eventId không hợp lệ" });

    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    // Pagination
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || "10")));
    const skip = (page - 1) * limit;

    const total = await Booking.countDocuments({ eventId: eventObjectId });

    // Analytics: revenue + unique buyers
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
    const uniqueBuyersCount = agg[0]?.uniqueBuyers?.length || 0;

    const bookings = await Booking.find({ eventId: eventObjectId })
      .populate({ path: "userId", select: "name email" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      message: "Lấy booking theo event thành công",
      count: bookings.length,
      total,
      totalRevenue,
      uniqueBuyers: uniqueBuyersCount,
      page,
      totalPages: Math.ceil(total / limit),
      bookings,
    });
  } catch (err) {
    console.error("Lỗi getBookingsByEvent:", err);
    return res.status(500).json({
      message: "Lỗi khi lấy booking theo event",
      error: err.message,
    });
  }
};