import express from "express";
import { getReviewsByEvent, addReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/event/:eventId", getReviewsByEvent);
router.post("/event/:eventId", protect, addReview);

export default router;
