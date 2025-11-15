import rateLimit from "express-rate-limit";

const isDisabled = process.env.DISABLE_RATE_LIMIT === "true";

// 🔥 Nếu disable → trả về middleware rỗng để bypass
const bypass = (req, res, next) => next();

export const registerLimiter = isDisabled
  ? bypass
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 5,
      message: { message: "Bạn đăng ký quá nhiều lần. Vui lòng thử lại sau." },
    });

export const loginLimiter = isDisabled
  ? bypass
  : rateLimit({
      windowMs: 5 * 60 * 1000,
      max: 10,
      message: { message: "Đăng nhập quá nhiều lần. Thử lại sau 5 phút." },
    });

