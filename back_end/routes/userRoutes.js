import express from "express";
import {
  getUserById,
  updateUser,
  updateAvatar,
  upload,
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟠 Lấy thông tin người dùng
router.get("/:id", protect, getUserById);

// 🟢 Cập nhật thông tin text (tên, studentId, avatar URL)
router.put("/:id", protect, updateUser);

// 📸 Upload & cập nhật ảnh đại diện
router.put("/:id/avatar", protect, upload.single("avatar"), updateAvatar);

export default router;
