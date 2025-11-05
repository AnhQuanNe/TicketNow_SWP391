import express from "express";
import {
  getUserById,
  updateUser,
  updateAvatar,
  upload,
  toggleFavoriteEvent, // 🟩 Thêm dòng này
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🟠 Lấy thông tin người dùng
router.get("/:id", protect, getUserById);

// 🟢 Cập nhật thông tin text (tên, studentId, avatar URL)
router.put("/:id", protect, updateUser);

// 📸 Upload & cập nhật ảnh đại diện
router.put("/:id/avatar", protect, upload.single("avatar"), updateAvatar);

// 💖🟩 THÊM ROUTE NÀY Ở ĐÂY
// [POST] /api/users/:id/favorites
// 👉 Khi user bấm "tim" 1 sự kiện, gọi route này để thêm hoặc xoá event khỏi danh sách yêu thích
router.post("/:id/favorites", protect, toggleFavoriteEvent);


export default router;
