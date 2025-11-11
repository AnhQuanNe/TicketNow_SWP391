import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyNotifications, markRead, afterPayment } from "../controllers/notificationController.js";

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.patch('/:id/read', protect, markRead);
router.post('/after-payment', protect, afterPayment);

export default router;
