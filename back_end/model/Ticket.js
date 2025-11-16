import mongoose from "mongoose";

// 🧩 Nếu model "Ticket" đã được định nghĩa, xóa nó khỏi cache trước
if (mongoose.models.Tickets) {
  delete mongoose.models.Tickets;
}

const ticketSchema = new mongoose.Schema(
  { 
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "eventId",
      required: true,
    },
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
