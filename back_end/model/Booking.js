import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },

    ticketType: {
      type: String,
      required: true,
      enum: ["student", "guest"],
    },

    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "checked-in", "checked-out"],
      default: "confirmed",
    },

    paymentId: { type: String, default: null },

    // ⭐ QUAN TRỌNG — Token chống giả mạo
    verifyToken: { type: String, required: true, unique: true },

    // QR code dạng base64
    qrCode: { type: String, default: null },

    // trạng thái check-in
    isCheckedIn: { type: Boolean, default: false },
    checkInTime: { type: Date, default: null },
  },
  { timestamps: true, collection: "Bookings" }
);

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;