// 🟩 Kích hoạt ESM: trong package.json phải có "type": "module"
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Event from './model/Event.js'
import eventRoutes from './routes/eventRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import Notification from './model/Notification.js'
import Booking from './model/Booking.js'
import crypto from 'crypto'
// 🧩 Import router cho login/register
import authRoutes from "./routes/authRoutes.js";
// import router cho ticket
import ticketRoutes from "./routes/ticketRoutes.js";
// import router cho payments
import paymentRoutes from "./routes/paymentRoutes.js";


import userRoutes from "./routes/userRoutes.js"; 

// 🟢 Cấu hình dotenv để đọc .env
dotenv.config();

// 🟢 Khởi tạo app + socket
const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: /http:\/\/localhost:\d+/, methods: ["GET", "POST"] },
});
app.set("io", io);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// 🟢 Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/TicketNow", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🟢 Schema cho Category
const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
});

const Category = mongoose.model("Category", categorySchema, "Categories");


// 🟢 API: Lấy toàn bộ categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/events', eventRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);


// 🟢 API: Lấy toàn bộ events (có filter categoryId)
app.get("/api/events", async (req, res) => {
  try {
    const { categoryId } = req.query;
    const events = categoryId
      ? await Event.find({ categoryId })
      : await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 API: Lấy chi tiết 1 sự kiện theo ID
app.get("/api/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 🔑 API: Đăng ký & đăng nhập người dùng
app.use(cors());
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);  // api ticket
app.use("/api/payment", paymentRoutes); // api router

// 🟢 🔑 API: Sửa thông tin người dùng
app.use("/api/users", userRoutes);

// � Socket.IO basic events
io.on("connection", (socket) => {
  // client join theo userId và theo event room để nhận review mới
  socket.on("join", ({ userId, eventId }) => {
    if (userId) socket.join(`user:${userId}`);
    if (eventId) socket.join(`event:${eventId}`);
  });

  socket.on("leave", ({ userId, eventId }) => {
    if (userId) socket.leave(`user:${userId}`);
    if (eventId) socket.leave(`event:${eventId}`);
  });
});

// Simple scheduler: mỗi 60s gửi các notification đến hạn (scheduledFor <= now, chưa sent)
setInterval(async () => {
  try {
    const due = await Notification.find({ scheduledFor: { $lte: new Date() }, sentAt: null });
    for (const n of due) {
      io.to(`user:${n.userId}`).emit('notify', {
        id: n._id.toString(),
        title: n.title,
        message: n.message,
        time: new Date().toISOString(),
      });
      n.sentAt = new Date();
      await n.save();
    }
  } catch (e) {
    // ignore scheduler errors
  }
}, 60000);

// 🟣 PayOS Webhook: cần raw body để verify chữ ký
app.post('/api/payment/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-signature'] || req.headers['x-payos-signature'];
    const secret = process.env.PAYOS_CHECKSUM_KEY;
    const bodyString = req.body.toString('utf8');
    const computed = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
    if (!signature || signature !== computed) {
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(bodyString);
    const { orderCode, status } = payload || {};
    if (status !== 'PAID') return res.status(200).send('Ignored');

    const booking = await Booking.findOne({ orderCode });
    if (!booking) return res.status(404).send('Order not found');

    // Idempotency
    if (booking.status === 'confirmed' || booking.paidAt) return res.status(200).send('OK');

    booking.status = 'confirmed';
    booking.paidAt = new Date();
    await booking.save();

    // Lên lịch nhắc 1 giờ trước event (nếu còn đủ thời gian)
    const ev = await Event.findById(booking.eventId);
    if (ev?.date) {
      const startTime = new Date(ev.date);
      const oneHourBefore = new Date(startTime.getTime() - 60 * 60 * 1000);
      if (oneHourBefore > new Date()) {
        await Notification.create({
          userId: booking.userId,
          eventId: booking.eventId,
          title: 'Nhắc nhở sự kiện',
          message: 'Sự kiện bạn đã mua sẽ bắt đầu sau 1 giờ',
          scheduledFor: oneHourBefore,
        });
      }
    }

    res.status(200).send('OK');
  } catch (e) {
    res.status(500).send('Server error');
  }
});

// �🟢 Chạy server (dùng http server)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`)
);

