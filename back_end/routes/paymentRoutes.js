import express from "express";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import Booking from "../model/Booking.js";
import Notification from "../model/Notification.js";
import { createNotification } from "../controllers/notificationController.js";
import Event from "../model/Event.js";
import { protect } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

router.post("/create-payment", protect, async (req, res) => {
  console.log(" Nhận yêu cầu tạo thanh toán:", req.body);
  try {
    const { amount, orderCode, description, eventId } = req.body;

    if (!amount || !orderCode || !eventId) {
      return res.status(400).json({ error: "Thiếu thông tin thanh toán (amount/orderCode/eventId)" });
    }

    // Tránh tạo duplicate khi người dùng gửi nhiều request nhanh (double-click)
    // Tìm booking pending gần nhất cho user+event trong 30s gần đây, nếu có thì reuse
  // Keep a string orderCode for storing in Booking (easier for lookups and compatibility)
  let orderCodeToUse = String(orderCode);
    const recentWindowMs = 30 * 1000; // 30s
    const recent = await Booking.findOne({
      userId: req.user._id,
      eventId,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - recentWindowMs) }
    });
    if (recent) {
      orderCodeToUse = String(recent.orderCode);
    } else {
      orderCodeToUse = String(orderCode ?? Date.now());
      await Booking.create({
        userId: req.user._id,
        eventId,
        ticketId: req.body.ticketId ?? null,
        quantity: req.body.quantity ?? 1,
        status: 'pending',
        orderCode: orderCodeToUse,
      });
    }

    // Prepare a numeric orderCode when calling PayOS (PayOS expects a number within JS safe integer range)
    let orderCodeNumber = Number(orderCodeToUse);
    const MAX_SAFE = Number.MAX_SAFE_INTEGER || 9007199254740991;
    if (!Number.isInteger(orderCodeNumber) || orderCodeNumber <= 0 || orderCodeNumber > MAX_SAFE) {
      // Fallback to a smaller unique integer (seconds since epoch) to satisfy PayOS constraints
      orderCodeNumber = Math.floor(Date.now() / 1000);
      console.warn('Coerced orderCode to safe integer for PayOS:', orderCodeNumber);
    }

    // Call PayOS with a numeric orderCode
    const payment = await payos.paymentRequests.create({
      orderCode: orderCodeNumber,
      amount,
      description: (description || "Thanh toán vé sự kiện").slice(0, 25),

      cancelUrl: "http://localhost:3000/payment-fail",
      returnUrl: "http://localhost:3000/payment-success",
    });

    // Log full response from PayOS for debugging
    console.log("✅ PayOS response:", payment);

    // Try multiple common property names used by payment SDKs / providers
    const checkoutUrl =
      payment?.checkoutUrl ||
      payment?.checkout_url ||
      payment?.url ||
      payment?.redirectUrl ||
      payment?.redirect_url ||
      payment?.data?.checkoutUrl ||
      payment?.data?.checkout_url ||
      null;

    console.log("Resolved checkoutUrl:", checkoutUrl);

    // Return both the resolved URL (if any) and the raw payment object for debugging on frontend
    return res.json({ checkoutUrl, payment });
  } catch (error) {
    console.error("❌ Lỗi tạo thanh toán:");
    console.error("→ Message:", error.message);
    console.error("→ Response data:", error.response?.data);
    console.error("→ Stack:", error.stack);

    return res.status(500).json({
      error: error.response?.data || error.message || "Không thể tạo mã QR",
    });
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
