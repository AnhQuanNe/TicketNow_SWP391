import mongoose from "mongoose";
import dotenv from "dotenv";
import MembershipPlan from "../model/MembershipPlan.js";

dotenv.config();

const defaultPlans = [
  {
    name: "FREE",
    displayName: "Hội viên Miễn phí",
    price: 0,
    durationDays: 3650,
    discountPercent: 0,
    earlyAccessMinutes: 0,
    monthlyVouchers: 0,
    prioritySupport: false,
    memberOnlyAccess: false,
    badgeColor: "#94a3b8",
    features: [
      "Quyền lợi mua vé cơ bản",
      "Tham gia các sự kiện mở bán công khai",
      "Phí dịch vụ tiêu chuẩn",
      "Lưu và theo dõi sự kiện yêu thích",
    ],
    isActive: true,
  },
  {
    name: "PREMIUM",
    displayName: "Gói Premium",
    price: 49000,
    durationDays: 30,
    discountPercent: 5,
    earlyAccessMinutes: 15,
    monthlyVouchers: 2,
    prioritySupport: false,
    memberOnlyAccess: true,
    badgeColor: "#00E599",
    features: [
      "Early Access: Mua vé sớm hơn 15 phút",
      "Giảm 5% phí dịch vụ khi mua vé",
      "Nhận 2 voucher ưu đãi mỗi tháng",
      "Quyền tham gia Member-only Events",
      "Thông báo mở bán sự kiện sớm",
      "Huy hiệu ⭐ Premium độc quyền trên hồ sơ",
    ],
    isActive: true,
  },
  {
    name: "VIP",
    displayName: "Gói VIP Đặc Quyền",
    price: 99000,
    durationDays: 30,
    discountPercent: 10,
    earlyAccessMinutes: 30,
    monthlyVouchers: 5,
    prioritySupport: true,
    memberOnlyAccess: true,
    badgeColor: "#f59e0b",
    features: [
      "Early Access: Mua vé sớm hơn 30 phút",
      "Giảm 10% phí dịch vụ khi mua vé",
      "Nhận 5 voucher ưu đãi mỗi tháng",
      "Tham gia sự kiện VIP & Member-only Events",
      "Ưu tiên hỗ trợ riêng (Priority Support 24/7)",
      "Thông báo mở bán sự kiện sớm nhất",
      "Ưu đãi đặc biệt dịp sinh nhật",
      "Huy hiệu 👑 VIP sang trọng trên hồ sơ",
    ],
    isActive: true,
  },
];

export const seedMembershipPlans = async () => {
  try {
    for (const plan of defaultPlans) {
      const existing = await MembershipPlan.findOne({ name: plan.name });
      if (!existing) {
        await MembershipPlan.create(plan);
        console.log(`✅ [Seed] Đã tạo gói Membership: ${plan.name} (${plan.displayName})`);
        // Ensure properties match
        await MembershipPlan.updateOne(
          { name: plan.name },
          {
            $set: {
              price: plan.price,
              discountPercent: plan.discountPercent,
              earlyAccessMinutes: plan.earlyAccessMinutes,
              monthlyVouchers: plan.monthlyVouchers,
              features: plan.features,
              displayName: plan.displayName,
            },
          }
        );
      }
    }
  } catch (err) {
    console.error("❌ Lỗi seedMembershipPlans:", err.message);
  }
};

// Nếu chạy trực tiếp qua node
if (process.argv[1]?.includes("seedMembershipPlans.js")) {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TicketNow";
  mongoose
    .connect(uri)
    .then(async () => {
      console.log("Connected to MongoDB for seeding...");
      await seedMembershipPlans();
      console.log("Seeding membership plans completed!");
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
