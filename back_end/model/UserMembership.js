import mongoose from "mongoose";

const userMembershipSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    planName: {
      type: String,
      enum: ["FREE", "PREMIUM", "VIP"],
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING_PAYMENT"],
      default: "ACTIVE",
      index: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    orderCode: {
      type: Number,
      index: true,
      sparse: true,
    },
    paymentId: {
      type: String,
      default: null,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    vouchersClaimed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index to quickly find user's active membership
userMembershipSchema.index({ userId: 1, status: 1 });

const UserMembership =
  mongoose.models.UserMembership ||
  mongoose.model("UserMembership", userMembershipSchema, "UserMemberships");

export default UserMembership;
