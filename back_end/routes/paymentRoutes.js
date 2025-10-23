import express from "express";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';
import path from 'path';
import Booking from "../model/Booking.js";
import { protect } from "../middleware/authMiddleware.js";

// Load .env explicitly from the backend folder to avoid issues when process
// is started from repo root (so cwd may not be back_end)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });
const router = express.Router();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

router.post("/create-payment", protect, async (req, res) => {
  console.log("📩 Nhận yêu cầu tạo thanh toán:", req.body);
  try {
    const { amount, orderCode, description, eventId } = req.body;

    if (!amount || !orderCode || !eventId) {
      return res.status(400).json({ error: "Thiếu thông tin thanh toán (amount/orderCode/eventId)" });
    }

    // Tạo một Booking pending làm "intent" 
    const bookingId = `bk_${Date.now()}`;
    await Booking.create({
      _id: bookingId,
      userId: req.user._id,
      eventId,
      status: "pending",
      orderCode,
      totalAmount: amount,
    });

    // ✅ Sử dụng đúng phương thức
    const payment = await payos.paymentRequests.create({
      orderCode,
      amount,
      description: (description || "Thanh toán vé sự kiện").slice(0, 25),

      cancelUrl: "http://localhost:3000/payment-fail",
      returnUrl: "http://localhost:3000/payment-success",
    });

    console.log("✅ Tạo thành công link thanh toán:", payment.checkoutUrl);
    return res.json({ checkoutUrl: payment.checkoutUrl });
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

export default router;
