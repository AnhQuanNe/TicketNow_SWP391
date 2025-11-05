import mongoose from "mongoose";
import Location from "./Location.js"; // ✅ THÊM DÒNG NÀY

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  categoryId: String,
  organizerId: String,
  locationId: { type: String, ref: "Location" }, // ✅ ref đúng tên model
  date: Date,
  ticketsAvailable: Number,
  imageUrl: String,
});

const Event =
  mongoose.models.Event || mongoose.model("Event", eventSchema, "Events");

export default Event;
