import express from "express";
import { getUserById, updateUser } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js"; // nếu bạn có middleware JWT

const router = express.Router();

// GET: /api/users/:id -> Lấy thông tin người dùng
router.get("/:id", protect, getUserById);

// PUT: /api/users/:id -> Cập nhật thông tin người dùng
router.put("/:id", protect, updateUser);

export default router;
