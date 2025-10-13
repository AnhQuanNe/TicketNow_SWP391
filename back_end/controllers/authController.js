import User from "../model/User.js";
import jwt from "jsonwebtoken";

// 🧩 Hàm tạo token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// 🟢 Đăng ký người dùng
export const register = async (req, res) => {
  try {
    const { name, email, passwordHash, phone, studentId } = req.body;

    // ✅ 1️⃣ Kiểm tra đủ trường (trừ studentId)
    if (!name || !email || !passwordHash || !phone) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập đầy đủ họ tên, email, mật khẩu và số điện thoại." });
    }

    // ✅ 2️⃣ Kiểm tra định dạng email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Định dạng email không hợp lệ! (chỉ chấp nhận dạng ten@gmail.com)" });
    }

    // ✅ 3️⃣ Kiểm tra định dạng số điện thoại (10 chữ số)
    if (!/^[0-9]{10}$/.test(phone)) {
      return res
        .status(400)
        .json({ message: "Số điện thoại phải gồm đúng 10 chữ số!" });
    }

    // ✅ 4️⃣ Kiểm tra trùng email, số điện thoại, mã sinh viên
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email này đã được sử dụng!" });
    }

    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ message: "Số điện thoại này đã được đăng ký!" });
    }

    if (studentId && studentId.trim() !== "") {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res.status(400).json({ message: "Mã sinh viên này đã tồn tại!" });
      }
    }

    // ✅ 5️⃣ Tạo tài khoản mới
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      studentId: studentId?.trim() || null,
    });

    // ✅ 6️⃣ Trả về kết quả
    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      studentId: user.studentId,
      token: generateToken(user._id),
    });

  } catch (err) {
    console.error("⚠️ Lỗi đăng ký:", err);

    // ✅ Nếu là lỗi Mongo duplicate key (E11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const value = err.keyValue[field];
      let msg = "Dữ liệu đã tồn tại!";
      if (field === "email") msg = `Email "${value}" đã được sử dụng!`;
      if (field === "phone") msg = `Số điện thoại "${value}" đã được đăng ký!`;
      if (field === "studentId") msg = `Mã sinh viên "${value}" đã tồn tại!`;
      return res.status(400).json({ message: msg });
    }

    // ✅ Lỗi khác
    return res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại sau." });
  }
};

// 🟢 Đăng nhập người dùng
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Email hoặc mật khẩu không đúng!" });
    }
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại." });
  }
};
