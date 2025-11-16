import User from "../model/User.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import Role from "../model/Role.js";

// 🆕 import thêm 2 model mới
import RegisterIP from "../model/RegisterIP.js";
import RegisterLog from "../model/RegisterLog.js";

// 🧩 Hàm tạo token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ============================================================================
// 🟢 Đăng ký người dùng (đã nâng cấp đầy đủ bảo mật nhưng giữ nguyên code cũ)
// ============================================================================
export const register = async (req, res) => {
  try {
    const { name, email, passwordHash, phone, studentId } =
      req.body;

    
    // =========================================================
    // 🆕 1️⃣ Kiểm tra mật khẩu mạnh
    // =========================================================
    const strongPass =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#?!@$%^&*-]).{8,}$/;

    if (!strongPass.test(passwordHash)) {
      return res.status(400).json({
        message:
          "Mật khẩu phải ≥ 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt!",
      });
    }

    // =========================================================
    // 🆕 2️⃣ Giới hạn IP (3 tài khoản / 24 giờ)
    // =========================================================
    
// Lấy IP thật
const userIP =
  req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

const now = Date.now();
const resetTime = now - 24 * 60 * 60 * 1000;

let ipLog = await RegisterIP.findOne({ ip: userIP });

if (ipLog) {
  // Nếu còn trong 24h và đã đủ 3 lần → chặn
  if (ipLog.lastRegister > resetTime && ipLog.count >= 20) {
    return res.status(429).json({
      message: "Bạn đã đạt giới hạn tạo tài khoản hôm nay (3 tài khoản/IP).",
    });
  }

  // Reset sau 24h
  if (ipLog.lastRegister < resetTime) {
    ipLog.count = 1;
  } else {
    ipLog.count += 1;
  }

  ipLog.lastRegister = now;
  await ipLog.save();
} else {
  // Tạo mới nếu chưa có
  await RegisterIP.create({
    ip: userIP,
    count: 1,
    lastRegister: now,
  });
}

    // =========================================================
    // 🆕 3️⃣ Ghi log đăng ký
    // =========================================================


    await RegisterLog.create({
      email,
      ip: userIP,
      device: req.headers["user-agent"],
      time: now,
      success: false,
    });

    // =========================================================
    // (GIỮ NGUYÊN CODE CŨ TỪ ĐÂY TRỞ XUỐNG)
    // =========================================================
// 🟢 1️⃣ Kiểm tra đầu vào
    if (!name || !email || !passwordHash || !phone) {
      return res.status(400).json({
        message:
          "Vui lòng nhập đầy đủ họ tên, email, mật khẩu và số điện thoại.",
      });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message:
          "Định dạng email không hợp lệ! (chỉ chấp nhận dạng ten@gmail.com)",
      });
    }

    if (!/^0[0-9]{9}$/.test(phone)) {
      return res.status(400).json({
        message: "Số điện thoại phải bắt đầu bằng số 0 và gồm đúng 10 chữ số!",
      });
    }

    // 🟢 2️⃣ Kiểm tra trùng email/sđt/mã sv
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ message: "Email này đã được sử dụng!" });

    const existingPhone = await User.findOne({ phone });
    if (existingPhone)
      return res
        .status(400)
        .json({ message: "Số điện thoại này đã được đăng ký!" });

    if (studentId && studentId.trim() !== "") {
      const existingStudent = await User.findOne({ studentId });
      if (existingStudent)
        return res
          .status(400)
          .json({ message: "Mã sinh viên này đã tồn tại!" });
    }

    // ✅ 3️⃣ Lấy Role mặc định (user) và gán roleId
    const defaultRole = await Role.findOne({ name: "user" });
    const roleId = defaultRole?._id;
    if (!roleId) {
      return res.status(500).json({ message: "Không tìm thấy Role mặc định" });
    }

    // =========================================================
    // 🆕 4️⃣ Tạo email verify token
    // =========================================================
    const emailToken = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // 🟢 4️⃣ Tạo user mới
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      studentId: studentId?.trim() || null,
      roleId,
      authProvider: "local",

      // 🆕 thêm 2 field mới
      emailVerified: false,
      emailVerifyToken: emailToken,
    });

    // =========================================================
    // 🆕 5️⃣ Gửi email xác thực
    // =========================================================
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const verifyURL = `${process.env.CLIENT_URL}/verify-email/${emailToken}`;

      await transporter.sendMail({
        from: `"TicketNow" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Xác thực tài khoản TicketNow",
        html: `
          <h3>Xin chào ${name},</h3>
<p>Vui lòng nhấn vào link bên dưới để kích hoạt tài khoản:</p>
          <a href="${verifyURL}">${verifyURL}</a>
          <p>Link hết hạn sau 24 giờ.</p>
        `,
      });
    } catch (err) {
      console.error("❌ Lỗi gửi email verify:", err);
    }

    // 🆕 Cập nhật log đăng ký thành công
    await RegisterLog.updateOne({ email }, { success: true });

    // 🟢 5️⃣ Trả kết quả
    return res.status(201).json({
      message:
        "🎉 Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản.",
    });
  } catch (err) {
    console.error("⚠️ Lỗi đăng ký chi tiết:", err);

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      const value = err.keyValue[field];
      let msg = "Dữ liệu đã tồn tại!";
      if (field === "email") msg = `Email "${value}" đã được sử dụng!`;
      if (field === "phone") msg = `Số điện thoại "${value}" đã được đăng ký!`;
      if (field === "studentId") msg = `Mã sinh viên "${value}" đã tồn tại!`;
      return res.status(400).json({ message: msg });
    }

    return res
      .status(500)
      .json({ message: "Lỗi hệ thống, vui lòng thử lại sau." });
  }
};

// ============================================================================
// 🟢 Đăng nhập người dùng (giữ nguyên – chỉ thêm check emailVerified)
// ============================================================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng!" });

    // 🆕 CHẶN ĐĂNG NHẬP NẾU CHƯA VERIFY EMAIL
    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Tài khoản chưa được kích hoạt. Vui lòng kiểm tra email.",
      });
    }

    if (user && user.isBanned) {
      return res.status(403).json({
        message: `Tài khoản của bạn đã bị khóa. Lý do: ${
          user.banReason || "Không rõ"
        }`,
      });
    }

    // ⚠️ Nếu tài khoản dùng Google, chặn đăng nhập local
    if (user.authProvider === "google") {
      return res.status(400).json({
        message:
          "Tài khoản này đăng ký bằng Google. Vui lòng dùng Google Sign-In.",
      });
    }

    if (user && (await user.matchPassword(password))) {
      let roleName = "user";
      if (user.roleId) {
        const r = await Role.findById(user.roleId).lean();
        if (r?.name) roleName = r.name;
      }
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        avatar: user.avatar,
        gender: user.gender,
        dob: user.dob,
        role: roleName,
        token: generateToken(user._id),
      });
    } else {
return res.status(401).json({ message: "Email hoặc mật khẩu không đúng!" });
    }
  } catch (err) {
    res.status(500).json({ message: "Lỗi máy chủ, vui lòng thử lại." });
  }
};

// ============================================================================
// 🟢 API verify email — sửa để tự động đăng nhập sau khi verify
// ============================================================================
export const verifyEmailToken = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email });

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy tài khoản." });

    // Đánh dấu đã verify
    user.emailVerified = true;
    user.emailVerifyToken = null;
    await user.save();

    // 🟢 Tạo token đăng nhập tự động
    const loginToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 🟢 Trả token và thông tin user cho frontend
    return res.json({
      message: "Kích hoạt tài khoản thành công!",
      token: loginToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        avatar: user.avatar,
        gender: user.gender,
        dob: user.dob,
        role: roleName,
      },
    });
  } catch (err) {
    return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn." });
  }
};


// ============================================================================
// 🟢 Đăng nhập Google (giữ nguyên code cũ)
// ============================================================================
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Thiếu credential từ frontend!" });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: "Không lấy được email từ Google!" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const defaultRole = await Role.findOne({ name: "user" });
      const roleId = defaultRole?._id;
      user = await User.create({
        name,
        email,
        passwordHash: null,
        avatar: picture,
        authProvider: "google",
        roleId,
        emailVerified: true, // Google auto-verified
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        message: `Tài khoản Google của bạn đã bị khóa. Lý do: ${
          user.banReason || "Không rõ"
        }`,
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
      role: roleName,
      token,
    });
  } catch (err) {
    res.status(500).json({
      message: "Đăng nhập Google thất bại.",
      error: err.message,
    });
  }
};

// ============================================================================
// 🟢 Forgot Password + OTP (giữ nguyên code cũ)
// ============================================================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email không tồn tại." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOTP = otp;
    user.resetOTPExpire = Date.now() + 5 * 60 * 1000;
    await user.save();

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

    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });

    if (user.resetOTP !== otp)
      return res.status(400).json({ message: "Mã OTP không hợp lệ." });

    if (user.resetOTPExpire < Date.now())
      return res.status(400).json({ message: "Mã OTP đã hết hạn." });
user.passwordHash = newPassword;
    user.resetOTP = null;
    user.resetOTPExpire = null;

    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi hệ thống." });
  }
};
// Lấy thông tin profile hiện tại (dựa trên token)
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    // Nếu user là mongoose doc, use method; if plain object, try to resolve
    let roleName = "user";
    if (user.getRoleName) {
      roleName = await user.getRoleName();
    } else if (user.roleId) {
      const r = await Role.findById(user.roleId).lean();
      roleName = r?.name || "user";
    } else if (user.role) {
      roleName = user.role;
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: roleName,
    });
  } catch (err) {
    console.error('❌ getProfile error:', err);
    res.status(500).json({ message: 'Lỗi khi lấy profile' });
  }
};