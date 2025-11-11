import express from "express";
import {
  getUserById,
  updateUser,
  updateAvatar,
  upload,
  toggleFavoriteEvent,
  getAllUsers,        // 🟢 thêm
  adminUpdateUser,    // 🟢 thêm
  deleteUser,
  banUser          // 🟢 thêm
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


// ======================= ADMIN =======================

// 🧩 Lấy danh sách tất cả người dùng
router.get("/", protect, verifyAdmin, getAllUsers);

// 🧩 Cập nhật vai trò hoặc trạng thái người dùng
router.put("/admin/:id", protect, verifyAdmin, adminUpdateUser);

// 🧩 Xóa người dùng
router.delete("/admin/:id", protect, verifyAdmin, deleteUser);

// 🧩 Ban (khóa / mở khóa) người dùng
router.put("/admin/ban/:id", protect, verifyAdmin, banUser);


// =========================================================

export default router;
