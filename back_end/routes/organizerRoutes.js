import express from "express";
import { getOrganizerProfile, updateOrganizerProfile } from "../controllers/organizerController.js";
import { protect } from "../middleware/authMiddleware.js"; // ✅ đổi verifyToken thành protect

const router = express.Router();

// 🟢 Các route yêu cầu xác thực JWT
router.get("/profile", protect, getOrganizerProfile);
router.put("/profile", protect, updateOrganizerProfile);

export default router;
