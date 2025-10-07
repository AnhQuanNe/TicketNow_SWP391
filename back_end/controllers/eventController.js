import Event from "../models/Event.js";

// [GET] /api/events
export const getEvents = async (req, res) => {
  try {
    const { search, category, sort, location } = req.query;

    let query = {};

    // Tìm kiếm theo tiêu đề
    if (search) {
      query.title = { $regex: search, $options: "i" }; // không phân biệt hoa/thường
    }

    // Lọc theo category
    if (category) {
      query.categoryId = category;
    }

    // Lọc theo location
    if (location) {
      query.locationId = location;
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
