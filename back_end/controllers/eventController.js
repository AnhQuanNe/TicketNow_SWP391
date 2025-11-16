import Event from "../model/Event.js";

// [GET] /api/events
export const getEvents = async (req, res) => {
  try {
    const { q, category, sort, location, startDate, endDate } = req.query;

    let query = {};

    // Tìm theo từ khóa
    if (q) {
      query.title = { $regex: q, $options: "i" };
    }

    // Lọc category
    if (category) {
      query.categoryId = category;
    }

    // Lọc location — string
    if (location) {
      query.locationId = location;
    }

    // Lọc theo ngày
    if (startDate || endDate) {
      query.date = {};

      if (startDate) query.date.$gte = new Date(startDate);

      if (endDate) {
        const e = new Date(endDate);
        e.setUTCHours(23, 59, 59, 999);
        query.date.$lte = e;
      }
    }

    // ⭐ KHÔNG populate locationId (vì là string)
    let events = await Event.find(query)
      .populate("categoryId", "name"); // vẫn populate category nếu cần

    // Sorting
    if (sort === "date_asc") {
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === "date_desc") {
      events.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === "tickets_desc") {
      events.sort((a, b) => b.ticketsAvailable - a.ticketsAvailable);
    }

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sự kiện",
      error: err.message,
    });
  }
};

// [GET] /api/events/:id
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("categoryId", "name"); // populate category nếu cần

    if (!event) {
      return res.status(404).json({ message: "Không tìm thấy sự kiện" });
    }

    res.status(200).json(event);
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy chi tiết sự kiện",
      error: err.message,
    });
  }
};

// [GET] /api/events/featured
export const getFeaturedEvents = async (req, res) => {
  try {
    const events = await Event.find({
      imageUrl: { $exists: true, $ne: "" },
      date: { $gte: new Date() },
    })
      .sort({ date: 1 })
      .limit(5);

    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sự kiện nổi bật",
      error: err.message,
    });
  }
};