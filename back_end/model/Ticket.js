// back_end/model/Ticket.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String, // hoặc mongoose.Schema.Types.ObjectId nếu muốn ref Booking
      ref: "Booking",
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true, // mỗi vé có 1 mã QR duy nhất
    },
    seatNumber: {
      type: String,
      required: true,
    },
    ticketType: {
      type: String,
      required: true, // ví dụ: VIP, Standard, VVIP
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Ticket", ticketSchema);
