import express from "express";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

router.post("/create-payment", async (req, res) => {
  console.log("📩 Nhận yêu cầu tạo thanh toán:", req.body);
  try {
    const { amount, orderCode, description } = req.body;

    if (!amount || !orderCode) {
      return res.status(400).json({ error: "Thiếu thông tin thanh toán" });
    }

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
