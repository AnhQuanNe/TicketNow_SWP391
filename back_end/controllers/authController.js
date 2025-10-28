import User from "../model/User.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
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
    if (!/^0[0-9]{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại phải bắt đầu bằng số 0 và gồm đúng 10 chữ số!",
      });
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
// Gửi OTP reset password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email không tồn tại." });

    // Tạo OTP ngẫu nhiên 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpire = Date.now() + 5 * 60 * 1000; // 5 phút
    await user.save();

    // Cấu hình gửi mail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"TicketNow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Xác nhận đặt lại mật khẩu",
      html: `
        <h3>Xin chào ${user.name || "bạn"},</h3>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản TicketNow.</p>
        <p>Mã OTP của bạn là:</p>
        <h2 style="color:#ff914d;">${otp}</h2>
        <p>Mã này sẽ hết hạn sau <b>5 phút</b>.</p>
      `,
    });

    res.json({ message: "OTP đã được gửi đến email của bạn." });
  } catch (err) {
    console.error("❌ Lỗi forgotPassword:", err);
    res.status(500).json({ message: "Gửi email thất bại." });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email không tồn tại." });

    if (user.resetOTP !== otp)
      return res.status(400).json({ message: "Mã OTP không đúng." });

    if (user.resetOTPExpire < Date.now())
      return res.status(400).json({ message: "Mã OTP đã hết hạn." });

    res.json({ message: "OTP hợp lệ, bạn có thể đặt mật khẩu mới." });
  } catch (err) {
    res.status(500).json({ message: "Lỗi xác minh OTP." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng." });

    if (user.resetOTP !== otp)
      return res.status(400).json({ message: "Mã OTP không hợp lệ." });

    if (user.resetOTPExpire < Date.now())
      return res.status(400).json({ message: "Mã OTP đã hết hạn." });

    user.passwordHash = newPassword;
    user.resetOTP = null;
    user.resetOTPExpire = null;
    await user.save(); // middleware sẽ tự hash trước khi lưu

    res.json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (err) {
    console.error("❌ resetPassword error:", err);
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};

