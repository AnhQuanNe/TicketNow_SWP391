import mongoose from "mongoose";

const promotionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["banner", "top", "featured", "recommended"],
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    position: {
      type: String,
      enum: ["home_banner", "listing_banner", "section"],
      default: "section",
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const PromotionPlan =
  mongoose.models.PromotionPlan ||
  mongoose.model("PromotionPlan", promotionPlanSchema, "PromotionPlans");

export default PromotionPlan;
