import mongoose from "mongoose";
import Booking from "../model/Booking.js";
import Event from "../model/Event.js";

// ✅ Tạo booking sau thanh toán
export const createBookingAfterPayment = async (req, res) => {
  try {
    const { userId, eventId, quantity, totalPrice, paymentId } = req.body;

    if (!userId || !eventId || !quantity || !totalPrice) {
      return res.status(400).json({ message: "Thiếu thông tin cần thiết" });
    }

    // Chuyển sang ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId.trim());
    const eventObjectId = new mongoose.Types.ObjectId(eventId.trim());
console.log("🔍 eventObjectId:", eventObjectId);
const event = await Event.findById(eventObjectId);
console.log("📦 Event tìm thấy:", event);

    
    if (!event) return res.status(404).json({ message: "Event không tồn tại" });

    // Kiểm tra đủ vé
    if (event.ticketsAvailable < quantity) {
      return res.status(400).json({ message: "Không đủ vé khả dụng" });
    }
    
    // Giảm số lượng vé còn lại
    const updatedEvent = await Event.findByIdAndUpdate(
  eventObjectId,
  { $inc: { ticketsAvailable: -quantity } },
  { new: true }
);

if (!updatedEvent) {
  return res.status(404).json({ message: "Không tìm thấy sự kiện để cập nhật vé" });
}

console.log("🎫 Đã trừ vé, còn lại:", updatedEvent.ticketsAvailable);
    // Kiểm tra xem user đã có vé trùng chưa (tránh double)
   // ✅ Kiểm tra vé trùng theo paymentId
const existing = await Booking.findOne({ paymentId });
if (existing) {
  console.log("⚠️ Vé đã tồn tại với paymentId:", paymentId);
  return res.status(200).json({ message: "Vé đã tồn tại", booking: existing });
}


    if (existing) {
      console.log("⚠️ Vé đã tồn tại, bỏ qua tạo mới");
      return res.status(200).json({ message: "Vé đã tồn tại", booking: existing });
    }

    // Tạo booking mới
    const newBooking = new Booking({
      userId: userObjectId,
      eventId: eventObjectId,
      quantity,
      totalPrice,
      paymentId,
      status: "confirmed",
    });

    await newBooking.save();

    console.log("✅ Đặt vé thành công:", newBooking._id);

    return res.status(201).json({
      message: "Đặt vé thành công",
      booking: newBooking,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lưu booking:", err);
    return res.status(500).json({
      message: "Lỗi khi lưu booking",
      error: err.message,
    });
  }
};

// ✅ Lấy danh sách vé của user
export const getBookingsByUser = async (req, res) => {
  try {
    let { userId } = req.params;
    if (!userId) return res.status(400).json({ message: "Thiếu userId" });

    userId = userId.trim();
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ message: "userId không hợp lệ" });

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const bookings = await Booking.find({ userId: userObjectId })
      .populate({
        path: "eventId",
        populate: {
          path: "locationId",
          model: "Location",
          select: "name address",
        },
        select: "title date locationId image ticketsAvailable",
      })
      .sort({ createdAt: -1 });

    if (!bookings.length) {
      return res.status(404).json({ message: "Không tìm thấy vé nào" });
    }

    return res.status(200).json({
      message: "✅ Lấy danh sách vé thành công",
      count: bookings.length,
      bookings,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy vé theo user:", err);
    return res.status(500).json({
      message: "Lỗi khi lấy vé",
      error: err.message,
    });
  }
};
