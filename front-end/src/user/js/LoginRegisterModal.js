import React, { useState } from "react";
import "../css/LoginRegisterModal.css";
import { loginUser, registerUser, googleLoginUser } from "../../api/authAPI";
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
        setTimeout(onClose, 500);
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

  // ✅ Google login handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await googleLoginUser({
        credential: credentialResponse.credential,
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data));
      onLoginSuccess?.(data);
      setTimeout(onClose, 500);
    } catch (err) {
      setMessage("❌ " + (err.message || "Đăng nhập Google thất bại"));
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
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
          <input
            name="password"
            placeholder="Nhập mật khẩu"
            type="password"
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Đang xác minh..."
              : type === "login"
              ? "Đăng nhập"
              : "Đăng ký"}
          </button>
        </form>

        {/* ✅ Nút Google đẹp, không trùng logo */}
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
      </div>
    </div>
  );
}
