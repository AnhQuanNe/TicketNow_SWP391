import mongoose from "mongoose";
import dotenv from "dotenv";
import PromotionPlan from "../model/PromotionPlan.js";

dotenv.config();

const defaultPlans = [
  // Banner Packages
  {
    name: "Banner Trang Chủ (7 ngày)",
    type: "banner",
    durationDays: 7,
    price: 500000,
    position: "home_banner",
    description: "Hiển thị banner lớn nổi bật ngay trang chủ TicketNow trong 7 ngày",
    isActive: true,
  },
  {
    name: "Banner Trang Chủ (14 ngày)",
    type: "banner",
    durationDays: 14,
    price: 900000,
    position: "home_banner",
    description: "Hiển thị banner lớn nổi bật ngay trang chủ TicketNow trong 14 ngày (Tiết kiệm 10%)",
    isActive: true,
  },
  {
    name: "Banner Trang Chủ (30 ngày)",
    type: "banner",
    durationDays: 30,
    price: 1500000,
    position: "home_banner",
    description: "Hiển thị banner lớn nổi bật toàn diện trong suốt 30 ngày",
    isActive: true,
  },

  // Featured Packages
  {
    name: "Featured Event (7 ngày)",
    type: "featured",
    durationDays: 7,
    price: 300000,
    position: "section",
    description: "Đưa sự kiện vào khu vực 'Sự kiện nổi bật' (Featured Events) ưu tiên trong 7 ngày",
    isActive: true,
  },
  {
    name: "Featured Event (14 ngày)",
    type: "featured",
    durationDays: 14,
    price: 550000,
    position: "section",
    description: "Đưa sự kiện vào khu vực 'Sự kiện nổi bật' trong 14 ngày",
    isActive: true,
  },
  {
    name: "Featured Event (30 ngày)",
    type: "featured",
    durationDays: 30,
    price: 900000,
    position: "section",
    description: "Đưa sự kiện vào khu vực 'Sự kiện nổi bật' trong 30 ngày",
    isActive: true,
  },

  // Top Event Packages
  {
    name: "Top Event (7 ngày)",
    type: "top",
    durationDays: 7,
    price: 700000,
    position: "section",
    description: "Đưa sự kiện lên vị trí Top đầu trang chủ, tiếp cận tối đa lượng người mua trong 7 ngày",
    isActive: true,
  },
  {
    name: "Top Event (14 ngày)",
    type: "top",
    durationDays: 14,
    price: 1300000,
    position: "section",
    description: "Đưa sự kiện lên vị trí Top đầu trang chủ trong 14 ngày",
    isActive: true,
  },
  {
    name: "Top Event (30 ngày)",
    type: "top",
    durationDays: 30,
    price: 2000000,
    position: "section",
    description: "Đưa sự kiện lên vị trí Top đầu trang chủ suốt 30 ngày",
    isActive: true,
  },

  // Recommended Event Packages
  {
    name: "Recommended Event (7 ngày)",
    type: "recommended",
    durationDays: 7,
    price: 250000,
    position: "section",
    description: "Được thuật toán gợi ý ưu tiên trong danh mục 'Dành cho bạn' trong 7 ngày",
    isActive: true,
  },
  {
    name: "Recommended Event (14 ngày)",
    type: "recommended",
    durationDays: 14,
    price: 450000,
    position: "section",
    description: "Được gợi ý ưu tiên trong danh mục 'Dành cho bạn' trong 14 ngày",
    isActive: true,
  },
  {
    name: "Recommended Event (30 ngày)",
    type: "recommended",
    durationDays: 30,
    price: 800000,
    position: "section",
    description: "Được gợi ý ưu tiên trong danh mục 'Dành cho bạn' trong 30 ngày",
    isActive: true,
  },
];

export async function seedPromotionPlans() {
  try {
    const count = await PromotionPlan.countDocuments();
    if (count === 0) {
      await PromotionPlan.insertMany(defaultPlans);
      console.log("✅ Seeded default PromotionPlans successfully!");
    } else {
      console.log(`ℹ️ PromotionPlans already exist (${count} plans).`);
    }
  } catch (err) {
    console.error("❌ Error seeding PromotionPlans:", err.message);
  }
}

// Nếu chạy trực tiếp file bằng node
if (process.argv[1]?.endsWith("seedPromotionPlans.js")) {
  mongoose
    .connect(process.env.MONGO_URI || "mongodb://localhost:27017/TicketNow")
    .then(async () => {
      console.log("Connected to MongoDB for seeding...");
      await seedPromotionPlans();
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
