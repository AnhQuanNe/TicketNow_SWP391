import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },

  // ⭐ categoryId dạng STRING (khớp với dữ liệu trong DB)
  categoryId: { type: String, required: true },

  // organizer vẫn ObjectId
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "Organizer" },

  // ⭐ locationId dạng STRING (vì DB của bạn dùng string)
  locationId: { type: String },

  date: { type: Date },
  ticketsAvailable: { type: Number, default: 0 },
  ticketTotal:{type: Number, default: 0},
  imageUrl: { type: String },
    // ⭐ Thêm field này để soft delete hoạt động
  status: {
    type: String,
    enum: ["active", "deleted"],
    default: "active",
  },
  // ⭐ Early Access: Thời gian mở bán công khai cho tài khoản thường
  saleStartTime: { type: Date, default: null },

  // ⭐ Member-only: Yêu cầu hạng thành viên để mua vé (NONE / PREMIUM / VIP)
  membershipRequired: {
    type: String,
    enum: ["NONE", "PREMIUM", "VIP"],
    default: "NONE",
  },

  // ⭐ Giá vé học sinh & vé thường
  studentPrice: { type: Number, default: 0 },
  regularPrice: { type: Number, default: 0 },
  eventRequestId: { type: mongoose.Schema.Types.ObjectId, ref: "EventRequest" },

  createdAt: { type: Date, default: Date.now },
});

// Collection "Events"
const Event =
  mongoose.models.Event || mongoose.model("Event", eventSchema, "Events");

export default Event;