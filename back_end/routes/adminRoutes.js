import express from "express";
import {
  adminGetAllUsers,
  adminUpdateUser,
  adminDeleteUser,
  adminBanUser,
  adminGetAllEvents,
  adminGetEventDetail,
  adminUpdateEvent,
  adminSoftDeleteEvent,
  adminReports,
  adminEventReport,
} from "../controllers/adminController.js";

import { protect, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟢 Lấy danh sách user
router.get("/users", protect, verifyAdmin, adminGetAllUsers);

// 🟢 Cập nhật role / trạng thái
router.put("/users/:id", protect, verifyAdmin, adminUpdateUser);

// 🟢 Xóa user
router.delete("/users/:id", protect, verifyAdmin, adminDeleteUser);

// 🟢 Khóa / mở khóa user
router.put("/users/:id/ban", protect, verifyAdmin, adminBanUser);

// ADMIN EVENT MANAGEMENT
router.get("/events", protect, verifyAdmin, adminGetAllEvents);
router.get("/events/:id", protect, verifyAdmin, adminGetEventDetail);
router.put("/events/:id", protect, verifyAdmin, adminUpdateEvent);
router.delete("/events/:id", protect, verifyAdmin, adminSoftDeleteEvent);

router.get("/reports", protect, verifyAdmin, adminReports);
router.get("/events/:id/report", adminEventReport);

export default router;