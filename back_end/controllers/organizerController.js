// back_end/controllers/organizerController.js
import mongoose from "mongoose";
import Organizer from "../model/Organizer.js";
import Event from "../model/Event.js";
import Booking from "../model/Booking.js";
import Review from "../model/Review.js";

// 🟢 Lấy thông tin profile của organizer
export const getOrganizerProfile = async (req, res) => {
  try {
    console.log("🧠 Organizer profile request for userId:", req.user._id);

    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    const organizer = await Organizer.findOne({ userId: userObjectId })
      .populate("userId", "name email");

    if (!organizer) {
      console.log("⚠️ Không tìm thấy organizer cho userId:", req.user._id);
      return res.status(200).json({ message: "not_found" });
    }

    res.status(200).json(organizer);
  } catch (err) {
    console.error("❌ Lỗi getOrganizerProfile:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟢 Thống kê / báo cáo cho 1 organizer (dashboard tổng quan)
export const getOrganizerReports = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);
    const organizer = await Organizer.findOne({ userId: userObjectId });
    if (!organizer) return res.status(404).json({ message: "Organizer not found" });

    // lấy tất cả event của organizer
    const events = await Event.find({ organizerId: organizer._id }).select("_id title ticketTotal ticketsAvailable date");
    const eventIds = events.map((e) => e._id);

    // nếu không có event thì trả về cấu trúc rỗng
    if (eventIds.length === 0) {
      return res.status(200).json({
        totalEvents: 0,
        totalOrders: 0,
        totalRevenue: 0,
        uniqueBuyers: 0,
        ticketsSold: 0,
        ticketsSoldByType: {},
        revenueByMonth: [],
        ratingDistribution: [1,2,3,4,5].map(r => ({ rating: r, count: 0 })),
        topEvents: [],
      });
    }

    // bookings match
    const bookingMatch = { eventId: { $in: eventIds }, status: { $ne: "cancelled" } };

    // totals (orders, revenue, tickets sold)
    const totalsAgg = await Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: null, totalRevenue: { $sum: { $ifNull: ["$totalPrice", 0] } }, totalOrders: { $sum: 1 }, ticketsSold: { $sum: { $ifNull: ["$quantity", 0] } } } },
    ]);
    const totalRevenue = totalsAgg[0]?.totalRevenue || 0;
    const totalOrders = totalsAgg[0]?.totalOrders || 0;
    const ticketsSold = totalsAgg[0]?.ticketsSold || 0;

    // unique buyers
    const uniqueBuyers = (await Booking.distinct("userId", bookingMatch)).length;

    // revenue by month
    const revenueByMonthRaw = await Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, total: { $sum: { $ifNull: ["$totalPrice", 0] } } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);
    const monthNamesShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const revenueByMonth = revenueByMonthRaw.map((r) => ({ label: `${r._id.year}-${String(r._id.month).padStart(2,'0')}`, monthLabel: monthNamesShort[r._id.month-1], year: r._id.year, month: r._id.month, total: r.total }));

    // rating distribution across organizer's events
    const ratingAgg = await Review.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);
    const ratingDistribution = [1,2,3,4,5].map((r) => ({ rating: r, count: ratingAgg.find(x => x._id === r)?.count || 0 }));

    // tickets sold by type
    const soldByTypeAgg = await Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: { $ifNull: ["$ticketType", "unknown"] }, count: { $sum: { $ifNull: ["$quantity", 0] } } } },
    ]);
    const ticketsSoldByType = {};
    soldByTypeAgg.forEach(s => { ticketsSoldByType[(s._id || 'unknown').toString().toLowerCase()] = s.count || 0; });

    // remaining tickets across all events (sum of ticketsAvailable)
    const ticketsRemainingTotal = events.reduce((sum, e) => sum + (e.ticketsAvailable || 0), 0);

    // pie counts: student, guest, remaining (fall back to 0 if missing)
    const pieCounts = {
      student: ticketsSoldByType['student'] || 0,
      guest: ticketsSoldByType['guest'] || 0,
      remaining: ticketsRemainingTotal || 0,
    };

    // top events by revenue
    const topEventsRaw = await Booking.aggregate([
      { $match: bookingMatch },
      { $group: { _id: "$eventId", totalRevenue: { $sum: { $ifNull: ["$totalPrice", 0] } }, ticketsSold: { $sum: { $ifNull: ["$quantity", 0] } } } },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);
    // lookup event title
    const topEvents = await Promise.all(topEventsRaw.map(async (t) => {
      const ev = await Event.findById(t._id).select("title date ticketTotal ticketsAvailable");
      return { eventId: t._id, title: ev?.title || '—', date: ev?.date || null, totalRevenue: t.totalRevenue, ticketsSold: t.ticketsSold };
    }));

    return res.status(200).json({
      totalEvents: events.length,
      totalOrders,
      totalRevenue,
      uniqueBuyers,
      ticketsSold,
      ticketsSoldByType,
      ticketsRemainingTotal,
      pieCounts,
      revenueByMonth,
      ratingDistribution,
      topEvents,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy reports organizer:", err);
    return res.status(500).json({ message: "Lỗi khi lấy reports organizer", error: err.message });
  }
};

// 🟠 Cập nhật profile
export const updateOrganizerProfile = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    const organizer = await Organizer.findOneAndUpdate(
      { userId: userObjectId },
      req.body,
      { new: true }
    );

    if (!organizer)
      return res.status(404).json({ message: "Organizer not found to update" });

    res.status(200).json(organizer);
  } catch (err) {
    console.error("❌ Lỗi updateOrganizerProfile:", err);
    res.status(500).json({ error: err.message });
  }
};
