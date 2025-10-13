import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// 🧩 Tạo Schema cho Ticket
const ticketSchema = new mongoose.Schema({
  eventId: mongoose.Schema.Types.ObjectId,
  seatNumber: String,
  price: Number,
  status: String, // available | sold
});

const Ticket = mongoose.model("Ticket", ticketSchema, "Tickets");

// 🟢 API: Lấy danh sách vé theo eventId
router.get("/event/:eventId", async (req, res) => {
  try {
    const tickets = await Ticket.find({ eventId: req.params.eventId });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
