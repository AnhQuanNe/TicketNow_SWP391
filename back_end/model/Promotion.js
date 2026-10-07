import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PromotionPlan",
      required: true,
    },
    type: {
      type: String,
      enum: ["banner", "top", "featured", "recommended"],
      required: true,
    },
    bannerTitle: {
      type: String,
      trim: true,
    },
    customBannerUrl: {
      type: String,
      trim: true,
    },
    bannerPosition: {
      type: String,
      enum: ["home_banner", "listing_banner", "section"],
      default: "home_banner",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    orderCode: {
      type: Number,
      required: true,
      unique: true,
    },
    paymentId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING_PAYMENT", "PAID", "FAILED", "CANCELLED"],
      default: "PENDING_PAYMENT",
    },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "ACTIVE", "EXPIRED", "CANCELLED", "REJECTED"],
      default: "PENDING_PAYMENT",
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Promotion =
  mongoose.models.Promotion ||
  mongoose.model("Promotion", promotionSchema, "Promotions");

export default Promotion;
