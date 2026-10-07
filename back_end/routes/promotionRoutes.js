import express from "express";
import {
  getPublicPlans,
  getActiveBanners,
  getRankedEvents,
  getMyEventsForPromotion,
  getMyPromotions,
  createPromotionOrder,
  verifyPromotionPayment,
  adminGetAllPromotions,
  adminUpdatePromotionStatus,
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  adminGetPromotionRevenueStats,
} from "../controllers/promotionController.js";
import { protect, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ================= PUBLIC ROUTES ================= */
router.get("/plans", getPublicPlans);
router.get("/active-banners", getActiveBanners);
router.get("/ranked-events", getRankedEvents);

/* ================= ORGANIZER ROUTES ================= */
router.get("/organizer/events", protect, getMyEventsForPromotion);
router.get("/my-promotions", protect, getMyPromotions);
router.post("/order", protect, createPromotionOrder);
router.post("/verify-payment", protect, verifyPromotionPayment);

/* ================= ADMIN ROUTES ================= */
router.get("/admin/all", protect, verifyAdmin, adminGetAllPromotions);
router.put("/admin/:id/status", protect, verifyAdmin, adminUpdatePromotionStatus);
router.get("/admin/plans", protect, verifyAdmin, adminGetPlans);
router.post("/admin/plans", protect, verifyAdmin, adminCreatePlan);
router.put("/admin/plans/:id", protect, verifyAdmin, adminUpdatePlan);
router.delete("/admin/plans/:id", protect, verifyAdmin, adminDeletePlan);
router.get("/admin/revenue-stats", protect, verifyAdmin, adminGetPromotionRevenueStats);

export default router;
