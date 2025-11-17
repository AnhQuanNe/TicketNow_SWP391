import express from "express";
import {
  getUserById,
  updateUser,
  updateAvatar,
  upload,
  toggleFavoriteEvent
} from "../controllers/userController.js";
import { protect, verifyAdmin } from "../middleware/authMiddleware.js"; // 🟢 thêm verifyAdmin

const router = express.Router();


// ======================= USER (self) =======================

// 🟠 Lấy thông tin người dùng
router.get("/:id", protect, getUserById);

// 🟢 Cập nhật thông tin text (tên, studentId, avatar URL)
router.put("/:id", protect, updateUser);

// 📸 Upload & cập nhật ảnh đại diện
router.put("/:id/avatar", protect, upload.single("avatar"), updateAvatar);

// 💖 Thêm hoặc xóa sự kiện yêu thích
router.post("/:id/favorites", protect, toggleFavoriteEvent);



export default router;
