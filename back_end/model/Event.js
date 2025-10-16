import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  // 🔗 Tham chiếu sang các collection khác (để populate)
  categoryId: { type: String, ref: "Category" },
  organizerId: { type: String, ref: "Organizer" },
  locationId: { type: String, ref: "Location" },
  date: { type: Date },
  ticketsAvailable: { type: Number, default: 0 },
  imageUrl: { type: String }, // nếu bạn có thêm ảnh sau này
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model("Event", eventSchema, 'Events');
export default Event;
