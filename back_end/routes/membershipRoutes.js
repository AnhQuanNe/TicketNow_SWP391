import express from "express";
import {
  getPublicPlans,
  getMyMembership,
  createMembershipPayment,
  verifyMembershipPayment,
  checkEventAccess,
  calculateTicketFee,
  adminGetPlans,
  adminUpdatePlan,
  adminGetSubscribers,
  adminGetStats,
} from "../controllers/membershipController.js";
import { protect, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= PUBLIC ROUTES ================= */
router.get("/plans", getPublicPlans);
router.get("/check-event-access/:eventId", protect, checkEventAccess);
router.post("/calculate-fee", protect, calculateTicketFee);

/* ================= USER AUTHENTICATED ROUTES ================= */
router.get("/me", protect, getMyMembership);
router.post("/create-payment", protect, createMembershipPayment);
router.post("/verify-payment", protect, verifyMembershipPayment);

/* ================= ADMIN MANAGEMENT ROUTES ================= */
router.get("/admin/plans", protect, verifyAdmin, adminGetPlans);
router.put("/admin/plans/:id", protect, verifyAdmin, adminUpdatePlan);
router.get("/admin/subscribers", protect, verifyAdmin, adminGetSubscribers);
router.get("/admin/stats", protect, verifyAdmin, adminGetStats);

export default router;
