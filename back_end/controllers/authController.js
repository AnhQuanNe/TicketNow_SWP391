import User from "../model/User.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

// 🧩 Hàm tạo token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 🟢 Đăng ký người dùng
export const register = async (req, res) => {
  try {
    const { name, email, passwordHash, phone, studentId } = req.body;

    // ✅ 1️⃣ Kiểm tra đủ trường (trừ studentId)
    if (!name || !email || !passwordHash || !phone) {
      return res.status(400).json({
        message:
          "Vui lòng nhập đầy đủ họ tên, email, mật khẩu và số điện thoại.",
      });
    }

    // ✅ 2️⃣ Kiểm tra định dạng email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message:
          "Định dạng email không hợp lệ! (chỉ chấp nhận dạng ten@gmail.com)",
      });
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
      return res
        .status(400)
        .json({ message: "Số điện thoại này đã được đăng ký!" });
    }

    if (studentId && studentId.trim() !== "") {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent) {
        return res
          .status(400)
          .json({ message: "Mã sinh viên này đã tồn tại!" });
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
    return res
      .status(500)
      .json({ message: "Lỗi hệ thống, vui lòng thử lại sau." });
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
        gender: user.gender, // 🩷 THÊM DÒNG NÀY
        dob: user.dob, // 🩵 VÀ DÒNG NÀY (nếu có hiển thị ngày sinh)
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Email hoặc mật khẩu không đúng!" });
    }
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại." });
  }
};
// 🟢 Đăng nhập bằng Google
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Thiếu credential từ frontend!" });
    }

    console.log(
      "📩 Nhận credential từ frontend:",
      credential.slice(0, 20) + "..."
    );

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log("✅ Payload từ Google:", payload);

    const { email, name, picture } = payload;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Không lấy được email từ Google!" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      console.log("🆕 Tạo user mới từ Google:", email);
      user = await User.create({
        name,
        email,
        passwordHash: null,
        avatar: picture,
        authProvider: "google",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || picture,
      token,
    });
  } catch (err) {
    console.error("❌ Lỗi Google login:", err.message);
    res.status(500).json({
      message: "Đăng nhập Google thất bại.",
      error: err.message,
    });
  }
};
