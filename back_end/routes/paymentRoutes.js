import express from "express";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import Booking from "../model/Booking.js"; // model MongoDB của bạn
import { generateQRCode } from "../utils/generateQRCode.js";
import { sendTicketEmail } from "../utils/sendEmail.js";
import User from "../model/User.js";
import Event from "../model/Event.js"; // đi lên 1 cấp rồi vào model

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
      orderCode, // sửa từ orderCodeNumber
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

// 2️⃣ Thanh toán thành công → lưu booking + tạo QR + gửi email
router.post("/payment-success", async (req, res) => {
  try {
    const { userId, eventId, quantity, totalPrice, paymentId } = req.body;

    // Lưu booking
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

    // Tạo QR code
    const qrCode = await generateQRCode(booking._id.toString());


    // Lấy thông tin user để gửi email
    // Lấy thông tin user và event
const user = await User.findById(userId);
const event = await Event.findById(eventId);

// Gửi email kèm QR
if (user?.email) {
  await sendTicketEmail(user, event, booking, qrCode);
}


    res.json({ success: true, message: "Booking created, QR code generated, email sent!" });
  } catch (err) {
    console.error("❌ Lỗi lưu booking hoặc gửi email:", err);
    res.status(500).json({ message: "Không thể lưu vé hoặc gửi email!" });
  }
});

// ✅ Verify payment after user returned to frontend (returnUrl) or when frontend calls verify
// This endpoint will call PayOS to fetch payment status by orderCode (or accept status from provider)
// then update Booking, create Notification(s) and emit realtime update via Socket.IO
router.post("/verify", async (req, res) => {
  try {
    const { orderCode, paymentId } = req.body || {};
    if (!orderCode && !paymentId) return res.status(400).json({ error: 'Missing orderCode or paymentId' });

    // Try to fetch payment info from PayOS SDK (attempt common method names)
    let paymentInfo = null;
    try {
      if (orderCode && payos.paymentRequests && typeof payos.paymentRequests.get === 'function') {
        paymentInfo = await payos.paymentRequests.get(orderCode);
      } else if (orderCode && payos.paymentRequests && typeof payos.paymentRequests.retrieve === 'function') {
        paymentInfo = await payos.paymentRequests.retrieve(orderCode);
      } else if (paymentId && payos.payments && typeof payos.payments.get === 'function') {
        paymentInfo = await payos.payments.get(paymentId);
      }
    } catch (e) {
      // don't fail hard here; we'll fall back to using provided fields
      console.warn('Could not fetch payment info from PayOS SDK:', e.message);
      paymentInfo = null;
    }

    const status = (paymentInfo && (paymentInfo.status || paymentInfo.paymentStatus)) || req.body.status || null;
    const resolvedPaymentId = (paymentInfo && (paymentInfo.paymentId || paymentInfo.id || paymentInfo.transactionId)) || paymentId || null;

    if (status !== 'PAID') {
      return res.status(200).json({ ok: false, message: 'Payment not completed', status });
    }

    const orderCodeStr = orderCode ? String(orderCode) : null;
    const booking = await Booking.findOne({ orderCode: orderCodeStr });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Use an atomic conditional update to avoid race creating duplicate confirmations/notifications
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: { $ne: 'confirmed' } },
      { $set: { status: 'confirmed', paidAt: new Date(), ...(resolvedPaymentId ? { paymentId: resolvedPaymentId } : {}) } },
      { new: true }
    );

    // If update returned null, booking was already confirmed by another process -> emit and return
    if (!updated) {
      const io = req.app.get('io');
      if (io) io.to(`user:${String(booking.userId)}`).emit('payment:update', { bookingId: booking._id, status: booking.status, paidAt: booking.paidAt });
      return res.json({ ok: true, message: 'Already confirmed' });
    }

    // Use the updated booking instance for downstream actions
    const confirmedBooking = updated;

    // Immediate notification to user (use helper that may schedule/send)
    const io = req.app.get('io');
    const agenda = req.app.get('agenda');
    const notif = await createNotification({
      userId: confirmedBooking.userId,
      eventId: confirmedBooking.eventId,
      title: 'Thanh toán thành công',
      message: `Đơn hàng ${confirmedBooking.orderCode} đã được thanh toán.`,
    }, io, agenda);

    // Lên lịch nhắc 1 giờ trước event (nếu event có ngày và còn thời gian)
    try {
      const ev = await Event.findById(booking.eventId);
      if (ev?.date) {
        // Normalize and compute reminder time
        const startTime = new Date(ev.date);
        let oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
        // Truncate seconds/milliseconds for cleaner schedule (e.g., 09:00:00)
        oneHourBefore.setSeconds(0, 0);
        console.log('Scheduling reminder: event start=', startTime.toISOString(), ' reminderAt=', oneHourBefore.toISOString());
        if (oneHourBefore > new Date()) {
          await createNotification({
            userId: confirmedBooking.userId,
            eventId: confirmedBooking.eventId,
            title: 'Nhắc nhở sự kiện',
            message: 'Sự kiện bạn đã mua sẽ bắt đầu sau 1 giờ',
            scheduledFor: oneHourBefore,
          }, io, req.app.get('agenda'));
        } else {
          console.log('Skipping scheduling reminder because less than 1 hour remains', { bookingId: booking._id.toString(), startTime: startTime.toISOString(), oneHourBefore: oneHourBefore.toISOString() });
        }
      }
    } catch (e) {
      console.warn('Could not schedule reminder notification:', e.message);
    }

    // Emit realtime events (payment update).
    // Note: notification emission is handled inside createNotification() for immediate notifications
    if (io) {
  io.to(`user:${String(confirmedBooking.userId)}`).emit('payment:update', { bookingId: confirmedBooking._id, status: confirmedBooking.status, paidAt: confirmedBooking.paidAt });
    }

    return res.json({ ok: true, message: 'Payment verified and booking confirmed' });
  } catch (error) {
    console.error('Error in /api/payment/verify:', error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
