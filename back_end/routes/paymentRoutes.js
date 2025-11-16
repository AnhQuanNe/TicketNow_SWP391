import express from "express";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import Booking from "../model/Booking.js";
import Event from "../model/Event.js";
import User from "../model/User.js";
import { generateQRCode } from "../utils/generateQRCode.js";
import { sendTicketEmail } from "../utils/sendEmail.js";
import { createNotification } from "../controllers/notificationController.js";

dotenv.config();
const router = express.Router();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

/* ===========================================================
   1) Tạo link thanh toán
============================================================ */
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

/* ============================================================
   2) Thanh toán thành công → Lưu booking + QR + email + notify ngay
============================================================ */
router.post("/payment-success", async (req, res) => {
  try {
    const { userId, eventId, quantity, totalPrice, paymentId } = req.body;

    /* ============================================================
       1) CHECK VÉ + TRỪ VÉ (Atomic – chống overbooking)
    ============================================================= */
    const ev = await Event.findById(eventId);
    if (!ev) {
      return res.status(404).json({ message: "Sự kiện không tồn tại!" });
    }

    if (ev.ticketQuantity < quantity) {
      return res.status(400).json({
        message: `Không đủ vé! Chỉ còn ${ev.ticketQuantity} vé.`,
      });
    }

    // 🔥 Atomic update: chỉ trừ vé nếu còn đủ TẠI THỜI ĐIỂM UPDATE
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        ticketQuantity: { $gte: quantity }
      },
      {
        $inc: { ticketQuantity: -quantity }
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        message: "Không thể trừ vé — có người khác vừa mua trước!",
      });
    }

    /* ============================================================
       2) Tạo booking sau khi đã trừ vé thành công
    ============================================================= */
    const booking = new Booking({
      userId,
      eventId,
      quantity,
      totalPrice,
      paymentId,
      orderCode: paymentId,
status: "confirmed",
      createdAt: new Date(),
    });

    await booking.save();

    /* ============================================================
       3) Gửi QR qua email
    ============================================================= */
    const qrCode = await generateQRCode(booking._id.toString());

    const user = await User.findById(userId);
    const event = await Event.findById(eventId);

    if (user?.email) {
      await sendTicketEmail(user, event, booking, qrCode);
    }

    /* ============================================================
       4) Notification thanh toán
    ============================================================= */
    try {
      const io = req.app.get("io");
      const agenda = req.app.get("agenda");

      await createNotification(
        {
          userId: booking.userId,
          eventId: booking.eventId,
          title: "Thanh toán thành công",
          message: `Vé của bạn đã được xác nhận.`,
        },
        io,
        agenda
      );
    } catch (error) {
      console.error("❌ Lỗi notification:", error);
    }

    /* ============================================================
       5) Lên lịch nhắc 1 giờ trước sự kiện
    ============================================================= */
    try {
      const io = req.app.get("io");
      const agenda = req.app.get("agenda");

      if (event?.date) {
        const startTime = new Date(event.date);
        let oneHourBefore = new Date(startTime.getTime() - 3600 * 1000);
        oneHourBefore.setSeconds(0, 0);

        if (oneHourBefore > new Date()) {
          await createNotification(
            {
              userId: booking.userId,
              eventId: booking.eventId,
              title: "Nhắc nhở sự kiện",
              message: "Sự kiện bạn đã mua sẽ bắt đầu trong 1 giờ!",
              scheduledFor: oneHourBefore,
            },
            io,
            agenda
          );
        }
      }
    } catch (error) {
      console.error("❌ Lỗi scheduling:", error);
    }

    /* ============================================================
       6) Thành công
    ============================================================= */
    res.json({
      success: true,
      message: "Booking created + tickets deducted + QR + email + notifications done.",
    });

  } catch (err) {
    console.error("❌ Lỗi khi xử lý payment-success:", err);
    res.status(500).json({ message: "Không thể xử lý thanh toán!" });
  }
});

/* ============================================================
   3) VERIFY – kiểm tra trạng thái thanh toán PayOS
============================================================ */
router.post("/verify", async (req, res) => {
  try {
    const { orderCode, paymentId } = req.body || {};
    if (!orderCode && !paymentId)
      return res.status(400).json({ error: "Missing orderCode or paymentId" });

    let paymentInfo = null;
    try {
if (orderCode && typeof payos.paymentRequests.get === "function") {
        paymentInfo = await payos.paymentRequests.get(orderCode);
      } else if (paymentId && typeof payos.payments.get === "function") {
        paymentInfo = await payos.payments.get(paymentId);
      }
    } catch (error) {
      console.warn("⚠ Không thể fetch PayOS:", error.message);
    }

    const status =
      paymentInfo?.status ||
      paymentInfo?.paymentStatus ||
      req.body.status ||
      null;

    const resolvedPaymentId =
      paymentInfo?.paymentId ||
      paymentInfo?.id ||
      paymentInfo?.transactionId ||
      paymentId;

    if (status !== "PAID") {
      return res.json({ ok: false, message: "Payment not completed", status });
    }

    // Tìm booking theo orderCode
    const booking = await Booking.findOne({ orderCode: String(orderCode) });

    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Tránh duplicate update
    const updated = await Booking.findOneAndUpdate(
      { _id: booking._id, status: { $ne: "confirmed" } },
      {
        $set: {
          status: "confirmed",
          paidAt: new Date(),
          paymentId: resolvedPaymentId,
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.json({ ok: true, message: "Already confirmed" });
    }

    const confirmedBooking = updated;

    // Emit real-time update
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${String(confirmedBooking.userId)}`).emit("payment:update", {
        bookingId: confirmedBooking._id,
        status: confirmedBooking.status,
      });
    }

    return res.json({
      ok: true,
      message: "Payment verified and booking confirmed",
    });
  } catch (error) {
    console.error("❌ Lỗi verify:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;