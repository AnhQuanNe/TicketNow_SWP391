import mongoose from "mongoose";

// 🧩 Nếu model "Ticket" đã được định nghĩa, xóa nó khỏi cache trước
if (mongoose.models.Tickets) {
  delete mongoose.models.Tickets;
}

const ticketSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      ref: "Booking",
      required: true,
    },
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },
    ticketType: {
      type: String,
      required: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ⚙️ Chỉ định rõ collection “tickets”
export default mongoose.model("Tickets", ticketSchema, "tickets");
