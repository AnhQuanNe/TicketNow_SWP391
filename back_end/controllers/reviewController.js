import Review from "../model/Review.js";
import mongoose from "mongoose";

// [GET] /api/reviews/event/:eventId
export const getReviewsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 8, 1);
    const filter = { eventId };

    const [items, total, agg] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: "userId", select: "name avatar" }),
      Review.countDocuments(filter),
      // Aggregate to compute average and sum across ALL reviews for this event
      (() => {
        const conds = [];
        if (mongoose.isValidObjectId(eventId)) {
          conds.push({ eventId: new mongoose.Types.ObjectId(eventId) });
        }
        // also match string form (phòng khi dữ liệu cũ lưu eventId dạng string)
        conds.push({ eventId });
        return Review.aggregate([
          { $match: { $or: conds } },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$rating" },
              sumRating: { $sum: "$rating" },
              count: { $sum: 1 },
            },
          },
        ]);
      })(),
    ]);

    const stats = Array.isArray(agg) && agg[0] ? agg[0] : null;
    const avgRatingRaw = stats?.avgRating || 0;
    const avgRating = Math.round(avgRatingRaw * 10) / 10;
    const sumRating = stats?.sumRating || 0;

    return res.json({
      data: items,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      avgRating,
      sumRating,
    });
  } catch (err) {
    return res.status(500).json({ message: "Lỗi khi lấy reviews", error: err.message });
  }
};

// [POST] /api/reviews/event/:eventId
export const addReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ message: "Chưa đăng nhập" });
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating phải từ 1-5" });
    }

    const review = await Review.create({ eventId, userId, rating, comment });
    const populated = await review.populate({ path: "userId", select: "name avatar" });

    // Nếu server có socket, phát sự kiện realtime
    try {
      req.app.get("io")?.to(`event:${eventId}`).emit("review:new", populated);
    } catch (e) {
      // ignore socket errors
    }

    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: "Lỗi khi thêm review", error: err.message });
  }
};
