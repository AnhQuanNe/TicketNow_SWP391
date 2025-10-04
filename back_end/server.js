import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/db.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// ⚙️ Bật CORS trước middleware khác
app.use(cors());

// Middleware để parse JSON
app.use(express.json());

// Kết nối MongoDB
connectDB();

// Route test
app.get("/", (req, res) => {
  res.send("TicketNow API running...");
});

// 🧩 Route đăng ký / đăng nhập
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
