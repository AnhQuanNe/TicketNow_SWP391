const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect("mongodb://localhost:27017/TicketNow", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Schema cho Category
const categorySchema = new mongoose.Schema({
  name: String,
  description: String,
});

const Category = mongoose.model("Category", categorySchema, "Categories");

// Schema cho Event
const eventSchema = new mongoose.Schema({
  title: String,
  categoryId: String, // đồng bộ với frontend
  banner: String,
  startDate: String,
  endDate: String,
  location: String,
});

const Event = mongoose.model("Event", eventSchema, "Events");

// API: Lấy toàn bộ categories
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Lấy toàn bộ events, có filter categoryId
app.get("/api/events", async (req, res) => {
  try {
    const { categoryId } = req.query;
    let events;
    if (categoryId) {
      events = await Event.find({ categoryId });
    } else {
      events = await Event.find();
    }
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server chạy tại http://localhost:${PORT}`));
