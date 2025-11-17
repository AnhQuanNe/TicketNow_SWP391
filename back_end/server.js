// 🟩 Kích hoạt ESM: trong package.json phải có "type": "module"
import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs"; // 🟢 THÊM: để tự tạo thư mục uploads khi chưa có
import Event from './model/Event.js'
import eventRoutes from './routes/eventRoutes.js'
import reviewRoutes from './routes/reviewRoutes.js'
import notificationRoutes from './routes/notificationRoutes.js'
import Notification from './model/Notification.js'
import Category from './model/Category.js';
import Booking from './model/Booking.js'
import crypto from 'crypto'
import Agenda from 'agenda';
import defineNotificationJobs from './jobs/notificationJobs.js';
// 🧩 Import router cho login/register
import authRoutes from "./routes/authRoutes.js";
// import router cho ticket
import ticketRoutes from "./routes/ticketRoutes.js";
// import router cho payments
import paymentRoutes from "./routes/paymentRoutes.js";
// 🟢 Import router cho Organizer
import organizerRoutes from "./routes/organizerRoutes.js";
import eventRequestRoutes from "./routes/eventRequestRoutes.js"; // Import routes
import roleRoutes from "./routes/roleRoutes.js";
//import booking
import bookingRoutes from "./routes/bookingRoutes.js";

import userRoutes from "./routes/userRoutes.js"; 

import adminRoutes from "./routes/adminRoutes.js";


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

// 🟢 THÊM DÒNG NÀY: để xử lý form-data có file (FormData từ React)
app.use(express.urlencoded({ extended: true }));

// 🟢 TỰ ĐỘNG TẠO THƯ MỤC "uploads" NẾU CHƯA CÓ
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Đã tự tạo thư mục 'uploads' vì chưa tồn tại");
}

// 🟢 CHO PHÉP TRUY CẬP ẢNH UPLOAD QUA ĐƯỜNG LINK /uploads
app.use("/uploads", express.static(uploadDir));

app.use("/api/admin", adminRoutes);

// 🟢 Kết nối MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/TicketNow", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB connected");

    // Ensure default roles exist
    try {
      const rolesToEnsure = ["admin", "organizer", "user"];
      const Role = (await import('./model/Role.js')).default;
      for (const name of rolesToEnsure) {
        const exists = await Role.findOne({ name }).lean();
        if (!exists) {
await Role.create({ name });
          console.log(`🔰 Đã tạo role mặc định: ${name}`);
        }
      }
    } catch (e) {
      console.warn('⚠️ Không thể tạo roles mặc định:', e.message || e);
    }

    // Initialize Agenda after Mongo connection
    try {
      const agenda = new Agenda({
        mongo: mongoose.connection.db,
        db: { collection: 'agendaJobs' },
      });

      // Define jobs
      defineNotificationJobs(agenda, io);

      await agenda.start();
      console.log('✅ Agenda started');

      // Expose agenda on app so controllers/routes can use it
      app.set('agenda', agenda);

      // Startup rescue: schedule any existing future notifications that lack jobId
      try {
        const pending = await Notification.find({ scheduledFor: { $gt: new Date() }, sentAt: null, $or: [ { jobId: { $exists: false } }, { jobId: null } ] });
        for (const p of pending) {
          try {
            const job = await agenda.schedule(p.scheduledFor, 'send-notification', { notificationId: p._id.toString() });
            p.jobId = job.attrs._id?.toString?.() || null;
            await p.save();
            console.log('Rescheduled pending notification into Agenda', { notificationId: p._id.toString(), jobId: p.jobId });
          } catch (e) {
            console.error('Failed to schedule pending notification', p._id.toString(), e);
          }
        }
      } catch (e) {
        console.error('Error while rescuing pending notifications', e);
      }
    } catch (e) {
      console.error('Failed to initialize Agenda', e);
    }
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err));





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
app.use("/api/bookings", bookingRoutes); // api booking

// 🟢 🔑 API: Sửa thông tin người dùng
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
// 🟢 API: Dành cho Organizer (Dashboard, Profile, Event,...)
app.use("/api/organizer", organizerRoutes);
app.use("/api/event-requests", eventRequestRoutes); // Đường dẫn xử lý tạo sự kiện

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

// NOTE: The polling scheduler was removed in favor of Agenda-backed jobs.
// Agenda will deliver scheduled notifications using the 'send-notification' job.


// �🟢 Chạy server (dùng http server)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`)
);
