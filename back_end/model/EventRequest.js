// back_end/model/EventRequest.js
import mongoose from 'mongoose';

// Định nghĩa schema cho sự kiện
const EventRequestSchema = new mongoose.Schema({
  eventName: { type: String, required: true }, // Tên sự kiện
  eventDate: { type: Date, required: true },   // Ngày sự kiện
  eventLocation: { type: String, required: true }, // Địa điểm
  ticketCount: { type: Number, required: true },   // Số lượng vé
  studentPrice: { type: Number, required: true },   // 🟢 thêm
  regularPrice: { type: Number, required: true },   // 🟢 thêm
  categoryId: { type: String }, // liên kết tới Category._id (string)
  startTime: { type: String }, // giờ bắt đầu (HH:MM)
  endTime: { type: String }, // giờ kết thúc (HH:MM)
  description: { type: String }, // Mô tả sự kiện
  coverImage: { type: String },  // Ảnh bìa sự kiện (nếu có)
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, // Trạng thái sự kiện
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organizer' }, // Liên kết với tổ chức sự kiện (Organizers)
  createdAt: { type: Date, default: Date.now },  // Thời gian tạo
  updatedAt: { type: Date, default: Date.now },  // Thời gian cập nhật
});

// Tạo model từ schema
const EventRequest = mongoose.model('EventRequest', EventRequestSchema);

export default EventRequest;
