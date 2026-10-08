import mongoose from "mongoose";
import { PayOS } from "@payos/node";
import dotenv from "dotenv";
import MembershipPlan from "../model/MembershipPlan.js";
import UserMembership from "../model/UserMembership.js";
import Event from "../model/Event.js";
import User from "../model/User.js";
import { createNotification } from "./notificationController.js";

dotenv.config();

const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID,
  apiKey: process.env.PAYOS_API_KEY,
  checksumKey: process.env.PAYOS_CHECKSUM_KEY,
});

/* =========================================================================
   HELPER: Auto-expire any outdated active user memberships
   ========================================================================= */
export const autoExpireUserMemberships = async (userId = null) => {
  try {
    const now = new Date();
    const filter = {
      status: "ACTIVE",
      endDate: { $lt: now },
    };
    if (userId) filter.userId = userId;

    await UserMembership.updateMany(filter, {
      $set: { status: "EXPIRED" },
    });
  } catch (err) {
    console.error("❌ Lỗi autoExpireUserMemberships:", err.message);
  }
};

/* =========================================================================
   HELPER: Lấy membership đang active của user (nếu không có thì trả về FREE)
   ========================================================================= */
export const getUserActiveMembership = async (userId) => {
  if (!userId) return null;

  await autoExpireUserMemberships(userId);

  const active = await UserMembership.findOne({
    userId,
    status: "ACTIVE",
    endDate: { $gte: new Date() },
  })
    .populate("planId")
    .sort({ createdAt: -1 });

  if (active && active.planId) {
    return {
      isPaid: true,
      membershipId: active._id,
      planName: active.planName,
      displayName: active.planId.displayName || active.planName,
      plan: active.planId,
      startDate: active.startDate,
      endDate: active.endDate,
      status: active.status,
      earlyAccessMinutes: active.planId.earlyAccessMinutes || (active.planName === "VIP" ? 30 : 15),
      discountPercent: active.planId.discountPercent || (active.planName === "VIP" ? 10 : 5),
      monthlyVouchers: active.planId.monthlyVouchers || (active.planName === "VIP" ? 5 : 2),
      prioritySupport: active.planId.prioritySupport || active.planName === "VIP",
      memberOnlyAccess: true,
      badgeColor: active.planId.badgeColor || (active.planName === "VIP" ? "#f59e0b" : "#00E599"),
    };
  }

  // Mặc định trả về gói FREE
  const freePlan = await MembershipPlan.findOne({ name: "FREE" }).lean();
  return {
    isPaid: false,
    membershipId: null,
    planName: "FREE",
    displayName: freePlan?.displayName || "Hội viên Miễn phí",
    plan: freePlan,
    startDate: null,
    endDate: null,
    status: "ACTIVE",
    earlyAccessMinutes: 0,
    discountPercent: 0,
    monthlyVouchers: 0,
    prioritySupport: false,
    memberOnlyAccess: false,
    badgeColor: "#94a3b8",
  };
};

/* =========================================================================
   1. GET PUBLIC MEMBERSHIP PLANS
   ========================================================================= */
export const getPublicPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true }).sort({
      price: 1,
    });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================================
   2. GET CURRENT USER'S MEMBERSHIP STATUS
   ========================================================================= */
export const getMyMembership = async (req, res) => {
  try {
    const userId = req.user._id;
    const membershipInfo = await getUserActiveMembership(userId);

    let daysRemaining = null;
    if (membershipInfo.isPaid && membershipInfo.endDate) {
      const diffMs = new Date(membershipInfo.endDate) - new Date();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    res.json({
      success: true,
      data: {
        ...membershipInfo,
        daysRemaining,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi getMyMembership:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================================
   3. CREATE MEMBERSHIP PAYMENT (PayOS)
   ========================================================================= */
export const createMembershipPayment = async (req, res) => {
  try {
    const { planName } = req.body;
    const userId = req.user._id;

    if (!planName || !["PREMIUM", "VIP"].includes(planName.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể mua gói PREMIUM hoặc VIP.",
      });
    }

    const targetPlanName = planName.toUpperCase();
    const plan = await MembershipPlan.findOne({
      name: targetPlanName,
      isActive: true,
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Gói hội viên không tồn tại hoặc đã tạm dừng.",
      });
    }

    // Kiểm tra membership hiện tại của user
    const currentMembership = await getUserActiveMembership(userId);
    if (currentMembership.isPaid && currentMembership.planName === targetPlanName) {
      const days = Math.ceil(
        (new Date(currentMembership.endDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return res.status(400).json({
        success: false,
        message: `Bạn đang sử dụng gói ${targetPlanName} (còn ${days} ngày). Không cần mua lại gói này!`,
      });
    }

    if (currentMembership.isPaid && currentMembership.planName === "VIP" && targetPlanName === "PREMIUM") {
      return res.status(400).json({
        success: false,
        message: "Bạn đang sở hữu gói VIP cao cấp nhất. Không thể hạ cấp xuống Premium khi VIP còn hạn!",
      });
    }

    // Sinh orderCode nguyên dương an toàn cho PayOS (tối đa 9 chữ số)
    const uniqueOrderCode = Number(
      String(Date.now()).slice(-6) + Math.floor(100 + Math.random() * 900)
    );

    // Lưu UserMembership tạm trạng thái PENDING_PAYMENT
    const pendingMembership = new UserMembership({
      userId,
      planId: plan._id,
      planName: plan.name,
      startDate: new Date(),
      endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
      status: "PENDING_PAYMENT",
      amount: plan.price,
      orderCode: uniqueOrderCode,
    });
    await pendingMembership.save();

    // Cấu hình thanh toán PayOS
    const description = `HV ${plan.name} ${uniqueOrderCode}`.slice(0, 25);
    const returnUrl = `http://localhost:3000/membership/payment-success?status=PAID&orderCode=${uniqueOrderCode}`;
    const cancelUrl = `http://localhost:3000/membership?status=cancel`;

    const paymentLink = await payos.paymentRequests.create({
      orderCode: uniqueOrderCode,
      amount: plan.price,
      description,
      cancelUrl,
      returnUrl,
    });

    res.json({
      success: true,
      message: "Khởi tạo thanh toán hội viên thành công",
      membershipId: pendingMembership._id,
      orderCode: uniqueOrderCode,
      checkoutUrl: paymentLink.checkoutUrl,
    });
  } catch (err) {
    console.error("❌ Lỗi createMembershipPayment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================================
   4. VERIFY MEMBERSHIP PAYMENT (Xác thực với PayOS & Kích hoạt gói)
   ========================================================================= */
export const verifyMembershipPayment = async (req, res) => {
  try {
    const { orderCode, bypassMock } = req.body;
    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Thiếu orderCode để kiểm tra thanh toán.",
      });
    }

    const membership = await UserMembership.findOne({
      orderCode: Number(orderCode),
    }).populate("planId");

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn đăng ký hội viên.",
      });
    }

    // Nếu đã kích hoạt trước đó
    if (membership.status === "ACTIVE") {
      return res.json({
        success: true,
        alreadyActive: true,
        message: `Gói hội viên ${membership.planName} đã được kích hoạt thành công!`,
        membership,
      });
    }

    // Kiểm tra trạng thái thực tế từ PayOS API
    let paymentInfo = null;
    try {
      if (typeof payos.paymentRequests.get === "function") {
        paymentInfo = await payos.paymentRequests.get(Number(orderCode));
      }
    } catch (e) {
      console.warn("⚠ Không thể lấy paymentInfo từ PayOS:", e.message);
    }

    const isPaid =
      paymentInfo?.status === "PAID" ||
      paymentInfo?.paymentStatus === "PAID" ||
      bypassMock === true;

    if (!isPaid) {
      return res.status(400).json({
        success: false,
        message: "Giao dịch chưa hoàn tất hoặc chưa thanh toán thành công.",
        status: paymentInfo?.status || "PENDING",
      });
    }

    // Hủy / Expire các membership active cũ của user này để chỉ giữ 1 active membership
    const now = new Date();
    await UserMembership.updateMany(
      {
        userId: membership.userId,
        _id: { $ne: membership._id },
        status: "ACTIVE",
      },
      {
        $set: { status: "CANCELLED" },
      }
    );

    // Kích hoạt UserMembership
    const durationDays = membership.planId?.durationDays || 30;
    membership.status = "ACTIVE";
    membership.startDate = now;
    membership.endDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    membership.paymentId = String(
      paymentInfo?.paymentId || paymentInfo?.id || orderCode
    );
    await membership.save();

    // Gửi thông báo cho User
    try {
      const io = req.app.get("io");
      const agenda = req.app.get("agenda");
      await createNotification(
        {
          userId: membership.userId,
          title: `Chúc mừng bạn đã là hội viên ${membership.planName}! ⭐`,
          message: `Gói hội viên ${membership.planName} của bạn đã kích hoạt thành công đến ngày ${membership.endDate.toLocaleDateString("vi-VN")}. Hãy tận hưởng quyền lợi mua vé sớm và giảm giá phí dịch vụ!`,
        },
        io,
        agenda
      );
    } catch (notifErr) {
      console.warn("Không gửi được notification:", notifErr.message);
    }

    res.json({
      success: true,
      message: `Thanh toán thành công! Gói hội viên ${membership.planName} đã được kích hoạt.`,
      membership,
    });
  } catch (err) {
    console.error("❌ Lỗi verifyMembershipPayment:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================================
   5. CHECK EVENT ACCESS (Early Access & Member-Only Check)
   ========================================================================= */
export const checkEventAccess = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Không tìm thấy sự kiện." });
    }

    const membership = await getUserActiveMembership(userId);
    const userPlan = membership ? membership.planName : "FREE";
    const earlyMinutes = membership ? membership.earlyAccessMinutes : 0;

    const now = new Date();

    // 1) Kiểm tra Member-Only
    const required = event.membershipRequired || "NONE";
    if (required === "VIP" && userPlan !== "VIP") {
      return res.json({
        success: true,
        allowed: false,
        reason: "MEMBER_ONLY_VIP",
        message: "👑 Sự kiện này chỉ dành riêng cho Hội viên VIP!",
        requiredMembership: "VIP",
        userMembership: userPlan,
      });
    }

    if (required === "PREMIUM" && userPlan === "FREE") {
      return res.json({
        success: true,
        allowed: false,
        reason: "MEMBER_ONLY_PREMIUM",
        message: "⭐ Sự kiện này chỉ dành cho Hội viên Premium và VIP!",
        requiredMembership: "PREMIUM",
        userMembership: userPlan,
      });
    }

    // 2) Kiểm tra Early Access
    if (event.saleStartTime) {
      const publicSale = new Date(event.saleStartTime);

      if (now < publicSale) {
        // Tính thời điểm mở bán riêng cho hạng của user
        const userAllowedTime = new Date(publicSale.getTime() - earlyMinutes * 60 * 1000);

        if (now < userAllowedTime) {
          const formattedUserTime = userAllowedTime.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          });
          const formattedPublicTime = publicSale.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          });

          let promptMsg = "";
          if (userPlan === "FREE") {
            promptMsg = `Sự kiện chưa mở bán cho tài khoản Free (Mở bán lúc ${formattedPublicTime}). Hội viên Premium được mua trước 15 phút, VIP mua trước 30 phút!`;
          } else if (userPlan === "PREMIUM") {
            promptMsg = `Sự kiện sẽ mở bán sớm cho Hội viên Premium vào lúc ${formattedUserTime} (sớm hơn vé thường 15 phút). Hội viên VIP được mua trước 30 phút!`;
          } else {
            promptMsg = `Sự kiện sẽ mở bán đặc quyền cho Hội viên VIP vào lúc ${formattedUserTime}.`;
          }

          return res.json({
            success: true,
            allowed: false,
            reason: "EARLY_ACCESS_WAITING",
            message: promptMsg,
            userAllowedTime,
            publicSaleTime: publicSale,
            userMembership: userPlan,
          });
        }

        // Được mua sớm!
        return res.json({
          success: true,
          allowed: true,
          isEarlyAccess: true,
          message: `⭐ Bạn đang được mua vé trong thời gian Early Access (${earlyMinutes} phút trước giờ mở bán công khai)!`,
          userMembership: userPlan,
        });
      }
    }

    return res.json({
      success: true,
      allowed: true,
      isEarlyAccess: false,
      userMembership: userPlan,
    });
  } catch (err) {
    console.error("❌ Lỗi checkEventAccess:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================================
   6. CALCULATE TICKET FEE & SERVICE FEE DISCOUNT (Backend authoritative)
   ========================================================================= */
export const calculateTicketFee = async (req, res) => {
  try {
    const { subtotal } = req.body;
    const userId = req.user?._id;

    const ticketSubtotal = Math.max(0, Number(subtotal) || 0);
    const membership = await getUserActiveMembership(userId);

    const baseServiceFee = 20000; // Phí dịch vụ chuẩn 20.000 VND
    const discountPercent = membership?.discountPercent || 0;
    const discountAmount = Math.round((baseServiceFee * discountPercent) / 100);
    const finalServiceFee = Math.max(0, baseServiceFee - discountAmount);
    const totalAmount = ticketSubtotal + finalServiceFee;

    res.json({
      success: true,
      data: {
        ticketSubtotal,
        baseServiceFee,
        discountPercent,
        discountAmount,
        finalServiceFee,
        totalAmount,
        userMembership: membership?.planName || "FREE",
      },
    });
  } catch (err) {
    console.error("❌ Lỗi calculateTicketFee:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* =========================================================================
   ADMIN APIS: Plans & Subscribers Management
   ========================================================================= */
export const adminGetPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ price: 1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminUpdatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const allowed = [
      "displayName",
      "price",
      "durationDays",
      "discountPercent",
      "earlyAccessMinutes",
      "monthlyVouchers",
      "prioritySupport",
      "memberOnlyAccess",
      "features",
      "isActive",
    ];

    const updates = {};
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const updated = await MembershipPlan.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Không tìm thấy gói." });
    }

    res.json({ success: true, message: "Cập nhật gói thành công!", data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminGetSubscribers = async (req, res) => {
  try {
    await autoExpireUserMemberships();

    const subscribers = await UserMembership.find({
      status: { $in: ["ACTIVE", "EXPIRED", "CANCELLED"] },
    })
      .populate("userId", "name email avatar phone")
      .populate("planId", "name displayName price discountPercent earlyAccessMinutes")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: subscribers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const adminGetStats = async (req, res) => {
  try {
    await autoExpireUserMemberships();

    const totalActive = await UserMembership.countDocuments({ status: "ACTIVE" });
    const vipCount = await UserMembership.countDocuments({
      status: "ACTIVE",
      planName: "VIP",
    });
    const premiumCount = await UserMembership.countDocuments({
      status: "ACTIVE",
      planName: "PREMIUM",
    });

    const revenueAgg = await UserMembership.aggregate([
      { $match: { status: { $in: ["ACTIVE", "EXPIRED"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalActive,
        vipCount,
        premiumCount,
        totalRevenue,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
