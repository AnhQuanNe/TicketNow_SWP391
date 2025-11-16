import express from "express";
import {
  register,
  login,
  googleLogin,
  forgotPassword,
  verifyOTP,
  resetPassword,
  verifyEmailToken,
  getProfile
} from "../controllers/authController.js";

// import { verifyRecaptcha } from "../middleware/reCaptcha.js";
import { registerLimiter, loginLimiter } from "../middleware/rateLimit.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// đăng ký
router.post("/register", registerLimiter, register);

// verify email
router.get("/verify-email/:token", verifyEmailToken);

// login
router.post("/login", loginLimiter, login);

// google
router.post("/google-login", googleLogin);

// forgot password
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// GET /api/auth/me -> profile (protected)
router.get("/me", protect, getProfile);

export default router;