import Event from "../model/Event.js";

// [GET] /api/events
export const getEvents = async (req, res) => {
  try {
    const { q, category, sort, location , startDate, endDate} = req.query;

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
