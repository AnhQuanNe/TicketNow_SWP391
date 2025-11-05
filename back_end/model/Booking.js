
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
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
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
    },
    quantity: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    paymentId: {
      type: String,
      default: null,
    }, 
      orderCode: {
        type: String,
        unique: true,
        sparse: true,
      },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Booking", bookingSchema, "Bookings");
