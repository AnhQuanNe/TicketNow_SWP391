import mongoose from "mongoose";

const membershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ["FREE", "PREMIUM", "VIP"],
    },
    displayName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationDays: {
      type: Number,
      default: 30, // 30 ngày/tháng
    },
    discountPercent: {
      type: Number,
      default: 0, // 0%, 5%, 10% giảm giá phí dịch vụ
      min: 0,
      max: 100,
    },
    earlyAccessMinutes: {
      type: Number,
      default: 0, // 0, 15, 30 phút
      min: 0,
    },
    monthlyVouchers: {
      type: Number,
      default: 0, // 0, 2, 5 voucher
      min: 0,
    },
    prioritySupport: {
      type: Boolean,
      default: false,
    },
    memberOnlyAccess: {
      type: Boolean,
      default: false,
    },
    features: [
      {
        type: String,
      },
    ],
    badgeColor: {
      type: String,
      default: "#64748b",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const MembershipPlan =
  mongoose.models.MembershipPlan ||
  mongoose.model("MembershipPlan", membershipPlanSchema, "MembershipPlans");

export default MembershipPlan;
