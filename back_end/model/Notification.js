import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    read: { type: Boolean, default: false },
    scheduledFor: { type: Date }, // thời điểm dự kiến gửi (vd: 1h trước event)
    sentAt: { type: Date },       // thời điểm đã gửi
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema, "Notifications");
export default Notification;
