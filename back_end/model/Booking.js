// models/Booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // booking_1, booking_2... (tự quản lý theo dạng string)
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // liên kết với User
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event", // liên kết với Event
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
      type: String, // sau này liên kết Payment
      default: null,
    },
  },
  { timestamps: true } // tự động thêm createdAt, updatedAt
);

module.exports = mongoose.model("Booking", bookingSchema);
