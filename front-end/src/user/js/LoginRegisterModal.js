import React, { useState } from "react";
import "../css/LoginRegisterModal.css";
import {
  loginUser,
  registerUser,
  googleLoginUser,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../../api/authAPI";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginRegisterModal({
  type,
  onClose,
  switchType,
  onLoginSuccess,
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    studentId: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ✅ State cho quên mật khẩu
  const [forgotStep, setForgotStep] = useState(0); // 0 = tắt, 1 = nhập email, 2 = nhập OTP, 3 = đặt mật khẩu
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (type === "login") {
        const data = await loginUser({
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        onLoginSuccess?.(data);

        // ✅ Phân quyền điều hướng
        if (type === "login") {
          const data = await loginUser({
            email: form.email,
            password: form.password,
          });
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data));
          onLoginSuccess?.(data);

          // 🧩 Nếu là admin thì lưu thêm adminToken để AdminRoute nhận ra
          if (data.role?.name === "admin" || data.role === "role_admin") {
            localStorage.setItem("adminToken", data.token);
          }

          // ✅ Phân quyền điều hướng
          if (data.role?.name === "admin" || data.role === "role_admin") {
            window.location.href = "/admin";
          } else if (
            data.role?.name === "organizer" ||
            data.role === "role_organizer"
          ) {
            window.location.href = "/organizer";
          } else {
            window.location.href = "/";
          }

          setTimeout(onClose, 500);
        }
      } else {
        const data = await registerUser({
          name: form.name,
          email: form.email,
          passwordHash: form.password,
          phone: form.phone,
          studentId: form.studentId,
        });
        setMessage(`🎉 Đăng ký thành công, chào ${data.name}!`);
      }
    } catch (err) {
      setMessage("❌ " + (err.message || "Lỗi kết nối"));
    } finally {
      setLoading(false);
    }
  };

  // ✅ Google login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLoginUser({
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      // 🧩 Nếu là admin thì lưu thêm adminToken để AdminRoute nhận ra
      if (data.role?.name === "admin" || data.role === "role_admin") {
        localStorage.setItem("adminToken", data.token);
      }
      onLoginSuccess?.(data);
      setTimeout(onClose, 500);
    } catch (err) {
      setMessage("❌ " + (err.message || "Đăng nhập Google thất bại"));
    }
  };

  // ✅ Gửi OTP
  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await forgotPassword(form.email);
      setForgotStep(2);
      setMessage("✅ Mã OTP đã được gửi đến email!");
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Xác minh OTP
  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      await verifyOtp(form.email, otp);
      setForgotStep(3);
      setMessage("✅ OTP hợp lệ! Hãy đặt mật khẩu mới.");
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Đặt lại mật khẩu
  const handleResetPassword = async () => {
    if (newPass !== confirmPass) {
      return setMessage("❌ Mật khẩu xác nhận không khớp!");
    }
    try {
      setLoading(true);
      await resetPassword(form.email, otp, newPass);
      setMessage("🎉 Mật khẩu mới đã được đặt lại thành công!");
      setTimeout(() => {
        setForgotStep(0);
        switchType("login");
        setMessage("");
      }, 2000);
    } catch (err) {
      setMessage("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderForgotPasswordSteps = () => {
    if (forgotStep === 1) {
      return (
        <>
          <h2>Quên mật khẩu</h2>
          <input
            name="email"
            type="email"
            placeholder="Nhập email của bạn"
            value={form.email}
            onChange={handleChange}
            required
          />
          <button type="button" onClick={handleSendOtp} disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi OTP"}
          </button>
          <p className="back-to-login" onClick={() => setForgotStep(0)}>
            ← Quay lại đăng nhập
          </p>
        </>
      );
    }
    if (forgotStep === 2) {
      return (
        <>
          <h2>Xác minh OTP</h2>
          <div className="otp-container">
            {[...Array(6)].map((_, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                className="otp-input"
                value={otp[i] || ""}
                onChange={(e) => {
                  const newOtp = otp.split("");
                  newOtp[i] = e.target.value.replace(/[^0-9]/g, "");
                  setOtp(newOtp.join(""));
                  if (e.target.value && e.target.nextSibling) {
                    e.target.nextSibling.focus();
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Backspace" &&
                    !e.target.value &&
                    e.target.previousSibling
                  ) {
                    e.target.previousSibling.focus();
                  }
                }}
              />
            ))}
          </div>
          <button type="button" onClick={handleVerifyOtp} disabled={loading}>
            {loading ? "Đang xác minh..." : "Xác nhận OTP"}
          </button>
          <p className="back-to-login" onClick={() => setForgotStep(1)}>
            ← Quay lại nhập email
          </p>
        </>
      );
    }
    if (forgotStep === 3) {
      return (
        <>
          <h2>Đặt lại mật khẩu</h2>
          <div className="password-field">
            <input
              type={showNewPass ? "text" : "password"}
              placeholder="Nhập mật khẩu mới"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <span
              className="toggle-password"
              onClick={() => setShowNewPass(!showNewPass)}
            >
              {showNewPass ? (
                <i className="fa-regular fa-eye-slash"></i>
              ) : (
                <i className="fa-regular fa-eye"></i>
              )}
            </span>
          </div>

          <div className="password-field">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Xác nhận mật khẩu mới"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
            <span
              className="toggle-password"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? (
                <i className="fa-regular fa-eye-slash"></i>
              ) : (
                <i className="fa-regular fa-eye"></i>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetPassword}
            disabled={loading}
          >
            {loading ? "Đang cập nhật..." : "Xác nhận đặt lại"}
          </button>
          <p className="back-to-login" onClick={() => setForgotStep(0)}>
            ← Quay lại đăng nhập
          </p>
        </>
      );
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
        {forgotStep > 0 ? (
          <>
            {renderForgotPasswordSteps()}
            {message && <p className="message">{message}</p>}
          </>
        ) : (
          <>
            <h2>{type === "login" ? "Đăng nhập" : "Đăng ký"}</h2>
            <form onSubmit={handleSubmit}>
              {type === "register" && (
                <>
                  <input
                    name="name"
                    placeholder="Họ tên"
                    onChange={handleChange}
                    required
                  />
                  <input
                    name="phone"
                    placeholder="Số điện thoại"
                    onChange={handleChange}
                  />
                  <input
                    name="studentId"
                    placeholder="Mã sinh viên (nếu có)"
                    onChange={handleChange}
                  />
                </>
              )}
              <input
                name="email"
                placeholder="Nhập email"
                type="email"
                onChange={handleChange}
                required
              />

              <div className="password-field">
                <input
                  name="password"
                  placeholder="Nhập mật khẩu"
                  type={showPassword ? "text" : "password"}
                  onChange={handleChange}
                  required
                />
                <span
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <i className="fa-regular fa-eye-slash"></i>
                  ) : (
                    <i className="fa-regular fa-eye"></i>
                  )}
                </span>
              </div>

              <button type="submit" disabled={loading}>
                {loading
                  ? "Đang xác minh..."
                  : type === "login"
                  ? "Đăng nhập"
                  : "Đăng ký"}
              </button>
            </form>

            {type === "login" && (
              <p
                className="forgot-password-link"
                onClick={() => setForgotStep(1)}
              >
                Quên mật khẩu?
              </p>
            )}

            <div className="google-section">
              <div className="google-divider">Hoặc</div>
              <div className="google-btn-wrapper">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() =>
                    setMessage("❌ Đăng nhập Google không thành công.")
                  }
                  text={
                    type === "login"
                      ? "Đăng nhập bằng Google"
                      : "Đăng ký bằng Google"
                  }
                  shape="rectangular"
                  theme="outline"
                  width="250"
                />
              </div>
            </div>

            {message && <p className="message">{message}</p>}

            <div className="switch-link">
              {type === "login" ? (
                <p>
                  Chưa có tài khoản?{" "}
                  <span onClick={() => switchType("register")}>Tạo ngay</span>
                </p>
              ) : (
                <p>
                  Đã có tài khoản?{" "}
                  <span onClick={() => switchType("login")}>Đăng nhập</span>
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
