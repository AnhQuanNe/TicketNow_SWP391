// controllers/adminController.js
import mongoose from "mongoose";
import User from "../model/User.js";
import Role from "../model/Role.js";
import Event from "../model/Event.js";
import Booking from "../model/Booking.js";
import Review from "../model/Review.js";
import Category from "../model/Category.js";

/* =========================================================
   🟢 ADMIN – LẤY DANH SÁCH NGƯỜI DÙNG
   ========================================================= */
export const adminGetAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (err) {
    console.error("❌ adminGetAllUsers:", err);
    res.status(500).json({ message: "Không thể lấy danh sách người dùng." });
  }
};

/* =========================================================
   🟢 ADMIN – CẬP NHẬT ROLE HOẶC TRẠNG THÁI USER
   ========================================================= */
export const adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { roleId, role, isActive } = req.body;

    const updateFields = {};

    if (isActive !== undefined) updateFields.isActive = isActive;

    if (roleId) {
      updateFields.roleId = roleId;
    } else if (role) {
      const roleDoc = await Role.findOne({ name: role }).lean();
      if (roleDoc) updateFields.roleId = roleDoc._id;
    }

    const updated = await User.findByIdAndUpdate(id, updateFields, {
      new: true,
    }).select("-passwordHash");

    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });

    res.json({
      message: "Cập nhật người dùng thành công.",
      user: updated,
    });
  } catch (err) {
    console.error("❌ adminUpdateUser:", err);
    res.status(500).json({ message: "Cập nhật thất bại." });
  }
};

/* =========================================================
   🟢 ADMIN – XÓA NGƯỜI DÙNG
   ========================================================= */
export const adminDeleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });

    res.json({ message: "Đã xóa người dùng thành công." });
  } catch (err) {
    console.error("❌ adminDeleteUser:", err);
    res.status(500).json({ message: "Xóa người dùng thất bại." });
  }
};

/* =========================================================
   🟢 ADMIN – KHÓA / MỞ KHÓA TÀI KHOẢN
   ========================================================= */
export const adminBanUser = async (req, res) => {
  try {
    const { id } = req.params;
    const reason = req.body?.reason;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }
/* ============================
       🔓 MỞ KHÓA (isBanned = true → false)
       ============================ */
    if (user.isBanned) {
      user.isBanned = false;
      user.banReason = "";

      // Không validate roleId, chỉ validate field thay đổi
      await user.save({ validateModifiedOnly: true });

      return res.json({
        message: `🔓 Đã mở khóa tài khoản ${user.name}.`,
      });
    }

    /* ============================
       🔒 KHÓA (cần lý do)
       ============================ */
    if (!reason || !reason.trim()) {
      return res.status(400).json({
        message: "Vui lòng nhập lý do khóa tài khoản.",
      });
    }

    user.isBanned = true;
    user.banReason = reason;

    await user.save({ validateModifiedOnly: true });

    return res.json({
      message: `🔒 Đã khóa tài khoản ${user.name}.`,
    });
  } catch (err) {
    console.error("❌ adminBanUser:", err);
    return res.status(500).json({
      message: "Lỗi hệ thống khi khóa/mở khóa tài khoản.",
      error: err.message,
    });
  }
};
// =======================================================
// 🟩 1) Lấy toàn bộ sự kiện
// =======================================================
export const adminGetAllEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      total: events.length,
      events,
    });
  } catch (err) {
    console.error("❌ adminGetAllEvents Error:", err);
    res.status(500).json({ message: "Không thể lấy danh sách sự kiện." });
  }
};

// =======================================================
// 🟦 2) Lấy chi tiết 1 sự kiện
// =======================================================
export const adminGetEventDetail = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();

    if (!event)
      return res.status(404).json({ message: "Không tìm thấy sự kiện." });

    res.json({ success: true, event });
  } catch (err) {
    console.error("❌ adminGetEventDetail Error:", err);
    res.status(500).json({ message: "Lỗi server khi lấy chi tiết sự kiện." });
  }
};

// =======================================================
// 🟧 3) Cập nhật thông tin sự kiện (Admin)
// =======================================================
export const adminUpdateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Các field được phép sửa từ FE
    const allowedFields = [
      "title",
      "description",
      "date",
      "startTime", // bạn dùng startTime, không dùng endTime
      "categoryId",
      "locationId",
      "imageUrl",
      "ticketsAvailable", // thêm
      "ticketTotal", // thêm (nếu có)
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
const updated = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sự kiện!",
      });
    }

    return res.json({
      success: true,
      message: "Cập nhật sự kiện thành công!",
      event: updated,
    });
  } catch (err) {
    console.log("adminUpdateEvent ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Cập nhật thất bại!",
      error: err.message,
    });
  }
};

// =======================================================
// 🟥 4) Xóa sự kiện + tất cả booking + review liên quan
// =======================================================
export const adminDeleteEvent = async (req, res) => {
  try {
    const id = req.params.id;

    // Xóa booking trước
    await Booking.deleteMany({ eventId: id });

    // Xóa review
    await Review.deleteMany({ eventId: id });

    // Xóa event
    const deleted = await Event.findByIdAndDelete(id);

    if (!deleted)
      return res
        .status(404)
        .json({ message: "Không tìm thấy sự kiện để xóa." });

    res.json({
      success: true,
      message: "Đã xóa sự kiện + booking + review liên quan!",
    });
  } catch (err) {
    console.error("❌ adminDeleteEvent Error:", err);
    res.status(500).json({ message: "Không thể xóa sự kiện." });
  }
};

// =======================================================
// 🟦 ADMIN REPORTS
// =======================================================

export const adminReports = async (req, res) => {
  try {
    // ================================
    // 1) Tổng sự kiện
    // ================================
    const totalEvents = await Event.countDocuments();

    // ================================
    // 2) Tổng đơn đặt vé
    // ================================
    const totalOrders = await Booking.countDocuments({
      status: { $ne: "cancelled" },
    });

    // ================================
    // 3) Tổng doanh thu
    // ================================
    const revenueData = await Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // ================================
    // 4) Rating Distribution (1-5 sao)
    // ================================
    const ratingDistribution = await Review.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const ratingData = [1, 2, 3, 4, 5].map((star) => {
      const found = ratingDistribution.find((r) => r._id === star);
      return { rating: star, count: found ? found.count : 0 };
    });

    // ================================
    // 5) Pie chart Student / Guest / Remaining
// ================================
    const ticketCounts = await Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { $toLower: "$ticketType" },
          count: { $sum: "$quantity" },
        },
      },
    ]);

    const student = ticketCounts.find((t) => t._id === "student")?.count || 0;
    const guest = ticketCounts.find((t) => t._id === "guest")?.count || 0;

    // Tổng vé còn lại = tổng ticketsAvailable các sự kiện
    const events = await Event.find({}, "ticketsAvailable");
    const remaining = events.reduce(
      (acc, ev) => acc + (ev.ticketsAvailable || 0),
      0
    );

    // ================================
    // 6) Doanh thu theo tháng
    // ================================
    const revenueByMonth = await Booking.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          total: { $sum: "$totalPrice" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formattedRevenue = revenueByMonth.map((item) => ({
      month: item._id.month,
      year: item._id.year,
      monthLabel: [
        "",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ][item._id.month],
      total: item.total,
    }));

    // ================================
    // RETURN REPORT
    // ================================
    return res.json({
      totalEvents,
      totalOrders,
      totalRevenue,
      ratingDistribution: ratingData,
      pieCounts: {
        student,
        guest,
        remaining,
      },
      revenueByMonth: formattedRevenue,
    });
  } catch (err) {
    console.error("REPORTS ERROR:", err);
    return res.status(500).json({ error: "Failed to load reports" });
  }
};

/* =========================================================
   🟦 REPORT CHI TIẾT TỪNG SỰ KIỆN
   ========================================================= */
export const adminEventReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Tạo ObjectId để match chính xác Booking.eventId
    const eventObjId = new mongoose.Types.ObjectId(id);

    // 1) Lấy sự kiện
    const event = await Event.findById(id).lean();
    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện." });
    }

    // 2) Tổng đơn
    const totalOrders = await Booking.countDocuments({
      eventId: eventObjId,
      status: { $ne: "cancelled" },
    });

    // 3) Vé đã bán
    const ticketsSoldData = await Booking.aggregate([
      { $match: { eventId: eventObjId, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$quantity" } } },
    ]);
const ticketsSold = ticketsSoldData[0]?.total || 0;

    // 4) Doanh thu
    const revenueData = await Booking.aggregate([
      { $match: { eventId: eventObjId, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueData[0]?.total || 0;

    // 5) Vé student / guest
    const typeCounts = await Booking.aggregate([
      { $match: { eventId: eventObjId, status: { $ne: "cancelled" } } },
      { $group: { _id: "$ticketType", count: { $sum: "$quantity" } } },
    ]);

    const student =
      typeCounts.find((t) => t._id?.toLowerCase() === "student")?.count || 0;
    const guest =
      typeCounts.find((t) => t._id?.toLowerCase() === "guest")?.count || 0;

    // 6) Rating
    const ratingStats = await Review.aggregate([
      { $match: { eventId: eventObjId } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);

    // Tạo mảng rating giống report tổng
    const ratingDistribution = [1, 2, 3, 4, 5].map((r) => {
      const found = ratingStats.find((x) => x._id === r);
      return { rating: r, count: found ? found.count : 0 };
    });

    const avgRatingRaw = await Review.aggregate([
      { $match: { eventId: eventObjId } },
      { $group: { _id: null, avg: { $avg: "$rating" } } },
    ]);

    const avgRating = avgRatingRaw[0]?.avg || 0;
    const totalReviews = ratingDistribution.reduce((a, b) => a + b.count, 0);

    // 7) Pie chart remaining
    const remaining = event.ticketsAvailable ?? 0;

    return res.json({
      success: true,
      eventId: id,
      title: event.title,

      totalOrders,
      ticketsSold,
      totalRevenue,

      student,
      guest,
      avgRating,
      totalReviews,

      pieCounts: {
        student,
        guest,
        remaining,
      },

      ratingDistribution,
    });
  } catch (err) {
    console.error("❌ adminEventReport Error:", err);
    return res.status(500).json({ message: "Không thể load report sự kiện." });
  }
};