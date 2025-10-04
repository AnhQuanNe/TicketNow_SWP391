import User from "../model/User.js";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// 🟩 Đăng ký
export const register = async (req, res) => {
  try {
    const { name, email, passwordHash, phone, studentId } = req.body; // 🆕 thêm studentId

    // Kiểm tra email trùng
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Tạo user mới
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      studentId: studentId || null, // 🆕 cho phép bỏ trống
    });

    // Trả về dữ liệu cho front-end
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      studentId: user.studentId, // 🆕 gửi lại studentId về FE
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Register error:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// 🟦 Đăng nhập
export const login = async (req, res) => {
  try {
    const { email, password } = req.body; // user nhập password plaintext
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        studentId: user.studentId, // 🆕 gửi kèm luôn
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
