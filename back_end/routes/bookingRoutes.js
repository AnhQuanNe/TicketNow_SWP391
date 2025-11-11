import express from "express";
import {
  createBookingAfterPayment,
  getBookingsByUser,
  checkInBooking,
  checkOutBooking,
} from "../controllers/bookingController.js";

const router = express.Router();

// 🧾 Tạo vé sau thanh toán
router.post("/create", createBookingAfterPayment);

// 📋 Lấy danh sách vé theo user
router.get("/:userId", getBookingsByUser);

// 🚪 Check-in bằng mã QR
router.post("/checkin", checkInBooking);

// 🚪 Check-out bằng mã QR
router.post("/checkout", checkOutBooking);

export default router;
