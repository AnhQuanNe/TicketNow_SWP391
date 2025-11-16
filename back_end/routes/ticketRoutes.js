import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// 🧩 Schema vé
const ticketSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // thêm để biết ai mua
  price: Number,
  quantity: Number,
  status: { type: String, default: "sold" }, // available | sold
  createdAt: { type: Date, default: Date.now },
});

const Ticket = mongoose.model("Ticket", ticketSchema, "Tickets");

// 🟢 Lấy danh sách vé theo eventId (giữ nguyên)
router.get("/event/:eventId", async (req, res) => {
  try {
    const tickets = await Ticket.find({ eventId: req.params.eventId });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🆕 Lưu vé sau khi thanh toán thành công
router.post("/", async (req, res) => {
  try {
    const { userId, eventId, quantity, price } = req.body;
    const ticket = await Ticket.create({
      userId,
      eventId,
      quantity,
      price,
      status: "sold",
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🆕 Lấy danh sách vé của người dùng
router.get("/user/:userId", async (req, res) => {
  try {
    const tickets = await Ticket.find({ userId: req.params.userId }).populate("eventId");
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
