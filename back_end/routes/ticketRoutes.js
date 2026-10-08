import express from "express";
import mongoose from "mongoose";
import Event from "../model/Event.js";
import EventRequest from "../model/EventRequest.js";

const router = express.Router();

// 🧩 Schema vé
const ticketSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, required: true },
    ticketType: { type: String },
    price: { type: Number, required: true, default: 0 },
    quantity: { type: Number, default: 0 },
    eligible: { type: String, default: "all" },
    status: { type: String, default: "available" },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "Tickets" }
);

const Ticket = mongoose.models.Ticket || mongoose.model("Ticket", ticketSchema, "Tickets");

/**
 * Lấy vé của sự kiện, nếu chưa có thì tự động tạo vé dựa trên thông tin sự kiện / event request
 */
async function getOrGenerateTickets(eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    return [];
  }

  const objId = new mongoose.Types.ObjectId(eventId);
  let tickets = await Ticket.find({ eventId: objId });

  if (tickets && tickets.length > 0) {
    return tickets;
  }

  // Nếu chưa có trong collection Tickets, tìm Event tương ứng
  const event = await Event.findById(objId);
  if (!event) return [];

  // Tìm EventRequest tương ứng nếu có
  let studentPrice = event.studentPrice;
  let regularPrice = event.regularPrice;
  let totalCount = event.ticketsAvailable || event.ticketTotal || 100;

  let eventReq = null;
  if (event.eventRequestId) {
    eventReq = await EventRequest.findById(event.eventRequestId);
  }
  if (!eventReq) {
    eventReq = await EventRequest.findOne({ eventName: event.title }).sort({ createdAt: -1 });
  }

  if (eventReq) {
    if (studentPrice == null || studentPrice === 0) {
      studentPrice = Number(eventReq.studentPrice) || 0;
    }
    if (regularPrice == null || regularPrice === 0) {
      regularPrice = Number(eventReq.regularPrice) || 0;
    }
    if (eventReq.ticketCount) {
      totalCount = Number(eventReq.ticketCount);
    }
  }

  // Fallback nếu không có giá được set
  const sPrice = studentPrice != null && studentPrice > 0 ? Number(studentPrice) : 50000;
  const rPrice = regularPrice != null && regularPrice > 0 ? Number(regularPrice) : 100000;
  const sQty = Math.floor(Number(totalCount) / 2);
  const rQty = Number(totalCount) - sQty;

  const newTickets = await Ticket.insertMany([
    {
      eventId: event._id,
      type: "Student",
      ticketType: "Student",
      price: sPrice,
      quantity: sQty,
      eligible: "student",
      status: "available",
      createdAt: new Date(),
    },
    {
      eventId: event._id,
      type: "Guest",
      ticketType: "Guest",
      price: rPrice,
      quantity: rQty,
      eligible: "guest",
      status: "available",
      createdAt: new Date(),
    },
  ]);

  console.log(`🎟️ Tự động tạo vé cho sự kiện ${event.title} (${event._id}): Student (${sPrice}), Guest (${rPrice})`);
  return newTickets;
}

// 🟢 Lấy danh sách vé theo eventId
router.get("/event/:eventId", async (req, res) => {
  try {
    const tickets = await getOrGenerateTickets(req.params.eventId);
    res.json(tickets);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách vé theo eventId:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Lấy danh sách vé (hỗ trợ ?eventId=... cho frontend)
router.get("/", async (req, res) => {
  try {
    const { eventId } = req.query;
    if (eventId) {
      const tickets = await getOrGenerateTickets(eventId);
      return res.json(tickets);
    }
    const tickets = await Ticket.find({});
    res.json(tickets);
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách vé:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🆕 Lưu vé sau khi thanh toán thành công
router.post("/", async (req, res) => {
  try {
    const { userId, eventId, quantity, price, type } = req.body;
    const ticket = await Ticket.create({
      userId,
      eventId,
      type: type || "Guest",
      ticketType: type || "Guest",
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
