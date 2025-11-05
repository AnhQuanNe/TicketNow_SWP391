import express from "express";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import Booking from "../model/Booking.js"; // model MongoDB của bạn

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
    res.json({ success: true, message: "Booking created successfully!" });
  } catch (err) {
    console.error("❌ Lỗi lưu booking:", err);
    res.status(500).json({ message: "Không thể lưu vé!" });
  }
});

export default router;
