import jwt from "jsonwebtoken";
import User from "../model/User.js";
import Organizer from "../model/Organizer.js"; // 🟢 Thêm dòng này

export const protect = async (req, res, next) => {
  let token = req.headers.authorization?.startsWith("Bearer")
    ? req.headers.authorization.split(" ")[1]
    : null;

  if (!token)
    return res
      .status(401)
      .json({ message: "Không có token, truy cập bị từ chối" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-passwordHash");
    // 🟢 Thêm đoạn này: nếu không có trong User thì tìm trong Organizer
    if (!req.user) {
      req.user = await Organizer.findById(decoded.id).select("-passwordHash");
    }
    next();
  } catch (error) {
    res.status(401).json({ message: "Token không hợp lệ" });
  }
};

// 🟢 Kiểm tra quyền Admin
export const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === "role_admin") {
    next();
  } else {
    res
      .status(403)
      .json({ message: "Bạn không có quyền truy cập tính năng này" });
  }
};
