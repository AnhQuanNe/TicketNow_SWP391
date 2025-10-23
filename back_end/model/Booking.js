// models/Booking.js (ESM)
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // ví dụ: bk_1699999999999
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentId: {
      type: String, // nếu cần liên kết Payment riêng
      default: null,
    },
    orderCode: {
      type: Number, // PayOS yêu cầu number
      unique: true,
      sparse: true,
    },
    totalAmount: { type: Number },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema);
