import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true }, // ✅ ref đúng rồi
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "confirmed",
    },
    paymentId: { type: String, default: null },
  },
  { timestamps: true } // ✅ tự động thêm createdAt + updatedAt
);

// ⚠️ Không nên chỉ định "Bookings" làm tên collection nếu model Event dùng mặc định "events"
const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema); // ✅ bỏ tham số "Bookings"

export default Booking;
