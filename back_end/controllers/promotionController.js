import mongoose from "mongoose";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import Promotion from "../model/Promotion.js";
import PromotionPlan from "../model/PromotionPlan.js";
import Event from "../model/Event.js";
import User from "../model/User.js";
import Organizer from "../model/Organizer.js";
import EventRequest from "../model/EventRequest.js";

dotenv.config();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

/* Helper: Auto-expire any outdated active promotions */
const autoExpirePromotions = async () => {
  try {
    const now = new Date();
    await Promotion.updateMany(
      {
        status: "ACTIVE",
        endDate: { $lt: now },
      },
      {
        $set: { status: "EXPIRED" },
      }
    );
  } catch (err) {
    console.error("Error auto-expiring promotions:", err.message);
  }
};

/* =========================================================================
   PUBLIC APIS
   ========================================================================= */

// 1. Get active promotion plans
export const getPublicPlans = async (req, res) => {
  try {
    const plans = await PromotionPlan.find({ isActive: true }).sort({
      type: 1,
      durationDays: 1,
    });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 2. Get active banners for Homepage / Listing
export const getActiveBanners = async (req, res) => {
  try {
    await autoExpirePromotions();
    const now = new Date();

    const banners = await Promotion.find({
      type: "banner",
      status: "ACTIVE",
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate("eventId")
      .populate("planId")
      .sort({ createdAt: -1 })
      .lean();

    // Lọc các banner mà event còn active (chưa bị xóa)
    const validBanners = banners.filter(
      (b) => b.eventId && b.eventId.status !== "deleted"
    );

    res.json({ success: true, data: validBanners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 3. Get Ranked & Categorized Events with Promotion Priority
export const getRankedEvents = async (req, res) => {
  try {
    await autoExpirePromotions();
    const now = new Date();

    // 1. Lấy tất cả sự kiện active
    const allEvents = await Event.find({ status: "active" }).lean();

    // 2. Lấy các promotion đang ACTIVE và trong thời hạn
    const activePromotions = await Promotion.find({
      status: "ACTIVE",
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    // Bản đồ eventId -> promotionTypes
    const promoMap = new Map();
    activePromotions.forEach((p) => {
      const eId = p.eventId.toString();
      if (!promoMap.has(eId)) {
        promoMap.set(eId, []);
      }
      promoMap.get(eId).push(p);
    });

    const topEvents = [];
    const featuredEvents = [];
    const recommendedEvents = [];
    const normalEvents = [];

    allEvents.forEach((ev) => {
      const promos = promoMap.get(ev._id.toString()) || [];
      const hasTop = promos.some((p) => p.type === "top");
      const hasFeatured = promos.some((p) => p.type === "featured");
      const hasRecommended = promos.some((p) => p.type === "recommended");

      // Gắn metadata promotion để frontend dễ hiển thị badge
      const enrichedEvent = {
        ...ev,
        isPromoted: promos.length > 0,
        promotionBadges: promos.map((p) => p.type),
      };

      if (hasTop) {
        topEvents.push(enrichedEvent);
      } else if (hasFeatured) {
        featuredEvents.push(enrichedEvent);
      } else if (hasRecommended) {
        recommendedEvents.push(enrichedEvent);
      } else {
        normalEvents.push(enrichedEvent);
      }
    });

    // Rule-based Recommendation logic:
    // Kết hợp các sự kiện có gói recommended + các sự kiện còn vé và chưa qua ngày diễn ra
    const ruleBasedRecommended = [
      ...recommendedEvents,
      ...normalEvents.filter((ev) => {
        const isUpcoming = ev.date ? new Date(ev.date) >= now : true;
        const hasTickets = (ev.ticketsAvailable ?? 10) > 0;
        return isUpcoming && hasTickets;
      }),
    ];

    // Priority Ranking tổng thể: TOP -> FEATURED -> RECOMMENDED -> NORMAL
    const rankedAll = [
      ...topEvents,
      ...featuredEvents,
      ...recommendedEvents,
      ...normalEvents,
    ];

    res.json({
      success: true,
      data: {
        rankedAll,
        topEvents,
        featuredEvents,
        recommendedEvents: ruleBasedRecommended,
        normalEvents,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================================
   ORGANIZER APIS (protect)
   ========================================================================= */

// Helper: Lấy danh sách ID liên quan đến Organizer (UserId + OrganizerId)
const getOrganizerRelatedIds = async (userId) => {
  const possibleIds = [];
  if (userId) {
    possibleIds.push(userId);
    if (mongoose.Types.ObjectId.isValid(userId)) {
      possibleIds.push(new mongoose.Types.ObjectId(userId));
    }
  }

  let orgDoc = null;
  if (userId) {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      orgDoc = await Organizer.findOne({
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { _id: new mongoose.Types.ObjectId(userId) },
        ],
      });
    } else {
      orgDoc = await Organizer.findOne({
        $or: [{ userId: userId }, { _id: userId }],
      });
    }
  }

  if (orgDoc) {
    possibleIds.push(orgDoc._id);
    possibleIds.push(orgDoc._id.toString());
    if (orgDoc.userId) {
      possibleIds.push(orgDoc.userId);
      possibleIds.push(orgDoc.userId.toString());
    }
  }

  return { possibleIds, orgDoc };
};

// 4. Get events of current organizer (để chọn khi promote)
export const getMyEventsForPromotion = async (req, res) => {
  try {
    const userRole = req.user.roleName || req.user.role || "organizer";

    // Nếu là admin thì có thể xem tất cả sự kiện active để quảng bá/test
    if (userRole === "admin") {
      const allEvents = await Event.find({ status: { $ne: "deleted" } })
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ success: true, data: allEvents });
    }

    const { possibleIds, orgDoc } = await getOrganizerRelatedIds(req.user._id);

    const orConditions = [{ organizerId: { $in: possibleIds } }];

    if (orgDoc && orgDoc.events && orgDoc.events.length > 0) {
      orConditions.push({ _id: { $in: orgDoc.events } });
    }

    // Kiểm tra thêm các EventRequest đã được approved của organizer này
    const approvedRequests = await EventRequest.find({
      organizerId: { $in: possibleIds },
      status: "approved",
    })
      .select("eventName")
      .lean();

    if (approvedRequests.length > 0) {
      const titles = approvedRequests.map((r) => r.eventName).filter(Boolean);
      if (titles.length > 0) {
        orConditions.push({ title: { $in: titles } });
      }
    }

    const events = await Event.find({
      $and: [{ $or: orConditions }, { status: { $ne: "deleted" } }],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Lấy tất cả EventRequests của organizer này (kể cả pending)
    const allRequests = await EventRequest.find({
      organizerId: { $in: possibleIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const pendingRequests = allRequests.filter((r) => r.status === "pending");
    const formattedPending = pendingRequests.map((r) => ({
      _id: r._id,
      title: r.eventName,
      description: r.description,
      date: r.eventDate,
      imageUrl: r.coverImage,
      ticketsAvailable: r.ticketCount,
      ticketTotal: r.ticketCount,
      locationId: r.eventLocation,
      isPendingApproval: true,
      status: "pending_approval",
      createdAt: r.createdAt,
    }));

    const existingTitles = new Set(events.map((e) => e.title?.toLowerCase().trim()));
    const finalEvents = [...events];

    formattedPending.forEach((p) => {
      if (!existingTitles.has(p.title?.toLowerCase().trim())) {
        finalEvents.push(p);
      }
    });

    res.json({ success: true, data: finalEvents });
  } catch (err) {
    console.error("❌ Lỗi getMyEventsForPromotion:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Get current organizer's promotions
export const getMyPromotions = async (req, res) => {
  try {
    await autoExpirePromotions();
    const userRole = req.user.roleName || req.user.role || "organizer";

    if (userRole === "admin") {
      const promotions = await Promotion.find({})
        .populate("eventId")
        .populate("planId")
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ success: true, data: promotions });
    }

    const { possibleIds } = await getOrganizerRelatedIds(req.user._id);

    const promotions = await Promotion.find({
      organizerId: { $in: possibleIds },
    })
      .populate("eventId")
      .populate("planId")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: promotions });
  } catch (err) {
    console.error("❌ Lỗi getMyPromotions:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 6. Create Promotion Order & Generate PayOS Checkout URL
export const createPromotionOrder = async (req, res) => {
  try {
    const { eventId, planId, customBannerUrl, bannerTitle, bannerPosition } =
      req.body;
    const orgId = req.user._id;
    const userRole = req.user.roleName || req.user.role || "organizer";

    if (!eventId || !planId) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu eventId hoặc planId." });
    }

    // 1. Kiểm tra event trong Event hoặc EventRequest
    let event = await Event.findById(eventId);
    if (!event) {
      const reqEv = await EventRequest.findById(eventId);
      if (reqEv) {
        event = {
          _id: reqEv._id,
          title: reqEv.eventName,
          imageUrl: reqEv.coverImage,
          organizerId: reqEv.organizerId,
        };
      }
    }

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Sự kiện không tồn tại." });
    }

    const { possibleIds, orgDoc } = await getOrganizerRelatedIds(req.user._id);
    const isAdmin = userRole === "admin";
    const isOwned =
      isAdmin ||
      (event.organizerId &&
        possibleIds.some(
          (id) => id.toString() === event.organizerId.toString()
        )) ||
      (orgDoc &&
        orgDoc.events?.some(
          (eid) => eid.toString() === event._id.toString()
        ));

    if (!isOwned) {
      return res.status(403).json({
        success: false,
        message: "Bạn chỉ có thể quảng bá sự kiện do chính mình tạo ra!",
      });
    }

    // 2. Lấy thông tin giá chính xác từ PromotionPlan (chống fake giá từ FE)
    const plan = await PromotionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({
        success: false,
        message: "Gói quảng cáo không hợp lệ hoặc đã bị vô hiệu hóa.",
      });
    }

    // 3. Tạo orderCode duy nhất cho PayOS
    // PayOS yêu cầu orderCode là số nguyên dương an toàn
    const uniqueOrderCode = Number(
      String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900)
    );

    // 4. Lưu promotion vào DB với status PENDING_PAYMENT
    const promotion = new Promotion({
      eventId: event._id,
      organizerId: orgId,
      planId: plan._id,
      type: plan.type,
      bannerTitle: bannerTitle || event.title,
      customBannerUrl: customBannerUrl || event.imageUrl,
      bannerPosition: bannerPosition || plan.position || "home_banner",
      price: plan.price,
      durationDays: plan.durationDays,
      orderCode: uniqueOrderCode,
      paymentStatus: "PENDING_PAYMENT",
      status: "PENDING_PAYMENT",
    });

    await promotion.save();

    // 5. Khởi tạo link thanh toán PayOS
    const description = `QC ${uniqueOrderCode}`.slice(0, 25);
    const returnUrl = `http://localhost:3000/organizer?tab=promotions&orderCode=${uniqueOrderCode}&payment=success`;
    const cancelUrl = `http://localhost:3000/organizer?tab=promotions&orderCode=${uniqueOrderCode}&payment=cancel`;

    const paymentLink = await payos.paymentRequests.create({
      orderCode: uniqueOrderCode,
      amount: plan.price,
      description,
      cancelUrl,
      returnUrl,
    });

    res.json({
      success: true,
      message: "Tạo đơn quảng cáo thành công",
      promotionId: promotion._id,
      orderCode: uniqueOrderCode,
      checkoutUrl: paymentLink.checkoutUrl,
    });
  } catch (err) {
    console.error("❌ Lỗi createPromotionOrder:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// 7. Verify Promotion Payment via PayOS & Activate Promotion
export const verifyPromotionPayment = async (req, res) => {
  try {
    const { orderCode } = req.body;
    if (!orderCode) {
      return res
        .status(400)
        .json({ success: false, message: "Thiếu orderCode để kiểm tra." });
    }

    const promotion = await Promotion.findOne({
      orderCode: Number(orderCode),
    }).populate("planId");

    if (!promotion) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn quảng cáo." });
    }

    // Nếu đã ACTIVE thì trả về thành công ngay
    if (promotion.status === "ACTIVE" || promotion.paymentStatus === "PAID") {
      return res.json({
        success: true,
        alreadyActive: true,
        message: "Quảng cáo đã được kích hoạt trước đó.",
        promotion,
      });
    }

    // Kiểm tra trực tiếp với cổng PayOS
    let paymentInfo = null;
    try {
      if (typeof payos.paymentRequests.get === "function") {
        paymentInfo = await payos.paymentRequests.get(Number(orderCode));
      }
    } catch (e) {
      console.warn("PayOS verify fetch error:", e.message);
    }

    const isPaid =
      paymentInfo?.status === "PAID" ||
      paymentInfo?.paymentStatus === "PAID" ||
      req.body.bypassMock === true; // Dự phòng môi trường test offline

    if (!isPaid) {
      return res.json({
        success: false,
        message: "Giao dịch chưa hoàn tất hoặc bị hủy.",
        status: paymentInfo?.status || "PENDING",
      });
    }

    // Kích hoạt Promotion
    const now = new Date();
    const durationDays = promotion.durationDays || 7;
    const endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    promotion.paymentStatus = "PAID";
    promotion.status = "ACTIVE";
    promotion.paidAt = now;
    promotion.startDate = now;
    promotion.endDate = endDate;
    promotion.paymentId = String(
      paymentInfo?.paymentId || paymentInfo?.id || orderCode
    );

    await promotion.save();

    res.json({
      success: true,
      message: "Thanh toán thành công! Gói quảng cáo đã được kích hoạt.",
      promotion,
    });
  } catch (err) {
    console.error("❌ Lỗi verifyPromotionPayment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================================
   ADMIN APIS (protect + verifyAdmin)
   ========================================================================= */

// 8. Admin: Get all promotions
export const adminGetAllPromotions = async (req, res) => {
  try {
    await autoExpirePromotions();
    const promotions = await Promotion.find()
      .populate("eventId")
      .populate("planId")
      .populate("organizerId", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: promotions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 9. Admin: Update status of a promotion (Approve/Reject/Disable)
export const adminUpdatePromotionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "PENDING_PAYMENT",
      "ACTIVE",
      "EXPIRED",
      "CANCELLED",
      "REJECTED",
    ];

    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ." });
    }

    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy promotion." });
    }

    promotion.status = status;
    // Nếu admin chủ động kích hoạt và chưa có ngày bắt đầu
    if (status === "ACTIVE" && !promotion.startDate) {
      promotion.startDate = new Date();
      promotion.endDate = new Date(
        Date.now() + (promotion.durationDays || 7) * 24 * 60 * 60 * 1000
      );
    }

    await promotion.save();

    res.json({
      success: true,
      message: `Đã cập nhật trạng thái thành ${status}`,
      promotion,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 10. Admin: Plans CRUD
export const adminGetPlans = async (req, res) => {
  try {
    const plans = await PromotionPlan.find().sort({ createdAt: -1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminCreatePlan = async (req, res) => {
  try {
    const { name, type, durationDays, price, position, description } = req.body;
    if (!name || !type || !durationDays || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng điền đủ thông tin gói." });
    }

    const plan = new PromotionPlan({
      name,
      type,
      durationDays: Number(durationDays),
      price: Number(price),
      position: position || "section",
      description: description || "",
      isActive: true,
      status: "ACTIVE",
    });

    await plan.save();
    res.json({ success: true, message: "Tạo gói quảng cáo thành công", plan });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminUpdatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await PromotionPlan.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy gói." });
    }
    res.json({
      success: true,
      message: "Cập nhật gói thành công",
      plan: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminDeletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await PromotionPlan.findByIdAndDelete(id);
    res.json({ success: true, message: "Đã xóa gói quảng cáo." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 11. Admin: Promotion Revenue Analytics & Statistics
export const adminGetPromotionRevenueStats = async (req, res) => {
  try {
    await autoExpirePromotions();

    // Doanh thu promotion = các promotion đã thanh toán thành công (PAID / ACTIVE / EXPIRED)
    const paidMatch = {
      $or: [
        { paymentStatus: "PAID" },
        { status: { $in: ["ACTIVE", "EXPIRED"] } },
      ],
    };

    // 1. Tổng tiền doanh thu promotion
    const revenueAgg = await Promotion.aggregate([
      { $match: paidMatch },
      { $group: { _id: null, totalRevenue: { $sum: "$price" } } },
    ]);
    const totalPromotionRevenue = revenueAgg[0]?.totalRevenue || 0;

    // 2. Thống kê theo trạng thái
    const statusCounts = await Promotion.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // 3. Thống kê theo loại gói (type: banner, top, featured, recommended)
    const typeDistribution = await Promotion.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          revenue: { $sum: "$price" },
        },
      },
    ]);

    // 4. Most Promoted Events (Top sự kiện được quảng bá nhiều nhất)
    const topPromotedEvents = await Promotion.aggregate([
      { $match: paidMatch },
      {
        $group: {
          _id: "$eventId",
          totalSpent: { $sum: "$price" },
          promoCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "Events",
          localField: "_id",
          foreignField: "_id",
          as: "event",
        },
      },
      { $unwind: "$event" },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          promoCount: 1,
          title: "$event.title",
          imageUrl: "$event.imageUrl",
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        totalPromotionRevenue,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        typeDistribution,
        topPromotedEvents,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
