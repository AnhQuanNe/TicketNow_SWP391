import express from "express";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import Booking from "../model/Booking.js"; // model MongoDB của bạn
import Event from "../model/Event.js";
import { createNotification } from "../controllers/notificationController.js";

dotenv.config();
const router = express.Router();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

// ✅ 1. Tạo link thanh toán
router.post("/create-payment", async (req, res) => {
  try {
    const { amount, orderCode, description } = req.body;

    const payment = await payos.paymentRequests.create({
      orderCode,
      amount,
      description,
      cancelUrl: "http://localhost:3000/payment-fail",
      returnUrl: `http://localhost:3000/payment-success?status=PAID`,
    });

    res.json({ checkoutUrl: payment.checkoutUrl });
  } catch (error) {
    console.error("❌ Lỗi tạo thanh toán:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 2. Sau khi thanh toán thành công → lưu vé
router.post("/payment-success", async (req, res) => {
  try {
    const { userId, eventId, quantity, totalPrice, paymentId } = req.body;

    const booking = new Booking({
      userId,
      eventId,
      quantity,
      totalPrice,
      paymentId,
      status: "confirmed",
      createdAt: new Date(),
    });

    await booking.save();
    // Tạo thông báo thanh toán thành công (gửi ngay bằng Socket.IO)
    try {
      const io = req.app.get('io');
      const agenda = req.app.get('agenda');
      await createNotification({
        userId: booking.userId,
        title: 'Thanh toán thành công',
        message: `Thanh toán thành công. Mã đơn: ${booking.paymentId || ''}`,
        eventId: booking.eventId,
      }, io, agenda);
    } catch (notifyErr) {
      console.error('❌ Lỗi khi tạo notification sau thanh toán:', notifyErr);
      // Không block luồng chính nếu notification thất bại
    }
    // Đồng thời lên lịch nhắc 1 giờ trước sự kiện (nếu có thời gian sự kiện và còn >1 giờ)
    try {
      const io = req.app.get('io');
      const agenda = req.app.get('agenda');
      const ev = await Event.findById(booking.eventId);
      if (ev && ev.date) {
        const startTime = new Date(ev.date);
        let oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
        oneHourBefore.setSeconds(0, 0);
        if (oneHourBefore > new Date()) {
          await createNotification({
            userId: booking.userId,
            eventId: booking.eventId,
            title: 'Nhắc nhở sự kiện',
            message: 'Sự kiện bạn đã mua sẽ bắt đầu sau 1 giờ',
            scheduledFor: oneHourBefore,
          }, io, agenda);
          console.log('⏰ Đã lên lịch nhắc 1 giờ trước sự kiện', { bookingId: booking._id.toString(), eventId: booking.eventId.toString(), scheduledFor: oneHourBefore.toISOString() });
        } else {
          console.log('ℹ️ Bỏ qua nhắc vì thời gian sự kiện < 1 giờ', { eventId: booking.eventId.toString(), startTime: startTime.toISOString() });
        }
      }
    } catch (schedErr) {
      console.error('❌ Lỗi khi lên lịch nhắc sự kiện:', schedErr);
    }
    res.json({ success: true, message: "Booking created successfully!" });
  } catch (err) {
    console.error("❌ Lỗi lưu booking:", err);
    res.status(500).json({ message: "Không thể lưu vé!" });
  }
});

export default router;
