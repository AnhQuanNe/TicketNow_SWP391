import Event from "../model/Event.js";
import Booking from "../model/Booking.js";
import Review from "../model/Review.js";
import mongoose from "mongoose";

const monthNamesShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// [GET] /api/events
export const getEvents = async (req, res) => {
  try {
    const { q, category, sort, location, startDate, endDate, organizerId } = req.query;

    let query = {};

    // Tìm kiếm theo tiêu đề
    if (q) {
      query.title = { $regex: q, $options: "i" }; // không phân biệt hoa/thường
    }

    // Lọc theo category
    if (category) {
      query.categoryId = category;
    }

    // Lọc theo location
    if (location) {
      query.locationId = location;
    }
    // Lọc theo organizer (nếu frontend truyền organizerId)
    if (organizerId) {
      query.organizerId = organizerId;
    }
    // loc theo ngay
     if (startDate || endDate) {
        query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        query.date.$lte = endOfDay;
      }
    }

    // Lấy dữ liệu
    let events = await Event.find(query);

    // Sắp xếp (theo ngày hoặc theo vé còn lại)
    if (sort === "date_asc") {
      events = events.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === "date_desc") {
      events = events.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === "tickets_desc") {
      events = events.sort((a, b) => b.ticketsAvailable - a.ticketsAvailable);
    }

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách sự kiện", error: err.message });
  }
};

// [GET] /api/events/:id
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy chi tiết sự kiện", error: err.message });
  }
};

// [GET] /api/events/:id/stats
export const getEventStats = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Thiếu event id" });
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: "event id không hợp lệ" });

    const eventObjectId = new mongoose.Types.ObjectId(id);

    // total bookings and revenue
    const totalBookings = await Booking.countDocuments({ eventId: eventObjectId });
    const revenueAgg = await Booking.aggregate([
      { $match: { eventId: eventObjectId, status: { $ne: "cancelled" } } },
      { $group: { _id: null, totalRevenue: { $sum: { $ifNull: ["$totalPrice", 0] } }, soldTickets: { $sum: { $ifNull: ["$quantity", 0] } } } },
    ]);
    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const ticketsSold = revenueAgg[0]?.soldTickets || 0;

    // revenue by month
    const revenueByMonthRaw = await Booking.aggregate([
      { $match: { eventId: eventObjectId, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total: { $sum: { $ifNull: ["$totalPrice", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const revenueByMonth = revenueByMonthRaw.map((r) => ({
      label: `${r._id.year}-${String(r._id.month).padStart(2, '0')}`,
      monthLabel: monthNamesShort[r._id.month - 1],
      year: r._id.year,
      month: r._id.month,
      total: r.total,
    }));

    // revenue by day
    const revenueByDayRaw = await Booking.aggregate([
      { $match: { eventId: eventObjectId, status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          total: { $sum: { $ifNull: ["$totalPrice", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const revenueByDay = revenueByDayRaw.map((r) => ({
      label: `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2,'0')}`,
      dayLabel: `${r._id.day} ${monthNamesShort[r._id.month - 1]} ${r._id.year}`,
      year: r._id.year,
      month: r._id.month,
      day: r._id.day,
      total: r.total,
    }));

    // revenue by day and ticket type (total money and count)
    let revenueByDayByType = [];
    try {
      const byTypeRaw = await Booking.aggregate([
        { $match: { eventId: eventObjectId, status: { $ne: "cancelled" } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
              ticketType: "$ticketType",
            },
            total: { $sum: { $ifNull: ["$totalPrice", 0] } },
            count: { $sum: { $ifNull: ["$quantity", 0] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]);

      revenueByDayByType = byTypeRaw.map((r) => ({
        label: `${r._id.year}-${String(r._id.month).padStart(2, '0')}-${String(r._id.day).padStart(2,'0')}`,
        dayLabel: `${r._id.day} ${monthNamesShort[r._id.month - 1]} ${r._id.year}`,
        ticketType: r._id.ticketType || "unknown",
        total: r.total,
        count: r.count,
      }));
    } catch (e) {
      revenueByDayByType = [];
    }

    // tickets sold by ticketType (sum of quantity per ticketType)
    // run a grouped aggregation to ensure we have totals even if revenueByDayByType is empty
    let ticketsSoldByType = {};
    try {
      const soldByTypeAgg = await Booking.aggregate([
        { $match: { eventId: eventObjectId, status: { $ne: "cancelled" } } },
        { $group: { _id: { $ifNull: ["$ticketType", "unknown"] }, count: { $sum: { $ifNull: ["$quantity", 0] } } } },
      ]);
      soldByTypeAgg.forEach(s => {
        const key = (s._id || 'unknown').toString().toLowerCase();
        ticketsSoldByType[key] = s.count || 0;
      });
    } catch (e) {
      ticketsSoldByType = {};
    }

    // rating distribution
    const ratingAgg = await Review.aggregate([
      { $match: { eventId: eventObjectId } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]);
    const ratingDistribution = [1,2,3,4,5].map((r) => ({ rating: r, count: ratingAgg.find(x => x._id === r)?.count || 0 }));

    // event info (ticketTotal if present)
    const eventDoc = await Event.findById(eventObjectId).select("ticketTotal ticketsAvailable title date locationId");

    return res.status(200).json({
      message: "✅ Thống kê sự kiện",
      totalBookings,
      totalRevenue,
      ticketsSold,
      ticketTotal: eventDoc?.ticketTotal ?? null,
      revenueByMonth,
      revenueByDay,
      revenueByDayByType,
      ticketsSoldByType,
      ratingDistribution,
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy stats sự kiện:", err);
    return res.status(500).json({ message: "Lỗi khi lấy stats sự kiện", error: err.message });
  }
};

//Banner
// [GET] /api/events/featured
export const getFeaturedEvents = async (req, res) => {
  try {
    // Lấy tối đa 5 sự kiện có ảnh, sắp xếp theo ngày gần nhất
    const events = await Event.find({
      imageUrl: { $exists: true, $ne: "" },
      date: { $gte: new Date() }, // Chỉ lấy sự kiện sắp tới
    })
      .sort({ date: 1 }) // Gần nhất trước
      .limit(5);

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sự kiện nổi bật (featured)",
      error: err.message,
    });
  }
};
