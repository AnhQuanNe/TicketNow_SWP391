// 🟩 Kích hoạt ESM: trong package.json phải có "type": "module"
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// 🟢 Khởi tạo app
const app = express();
app.use(cors());
app.use(express.json());

// 🟢 Kết nối MongoDB
mongoose
  .connect("mongodb://localhost:27017/TicketNow", {
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

// 🟢 Schema cho Event
const eventSchema = new mongoose.Schema({
  title: String,
  categoryId: String, // đồng bộ với frontend
  banner: String,
  startDate: String,
  endDate: String,
  location: String,
});

const Event = mongoose.model("Event", eventSchema, "Events");

// 🟢 API: Lấy toàn bộ categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// 🟢 Chạy server
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server chạy tại http://localhost:${PORT}`));
