import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import "../css/MyAccount.css";

import {
  uploadAvatar,
  updateUser,
} from "../../api/userApi";
import { getMyMembership } from "../../api/membershipApi";

export default function MyAccount() {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentId: "",
    avatar: "",
    dob: "",
    gender: "",
  });

  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const [membership, setMembership] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ Lấy user từ localStorage khi vào trang
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (savedUser) {
      setUser(savedUser);

      setFormData({
        name: savedUser.name || "",
        email: savedUser.email || "",
        phone: savedUser.phone || "",
        studentId: savedUser.studentId || "",
        avatar: savedUser.avatar || "",
        dob: savedUser.dob || "",
        gender: savedUser.gender || "",
      });

      setPreview(savedUser.avatar || "");
    }

    if (token) {
      getMyMembership(token)
        .then((res) => {
          if (res?.success) setMembership(res.data);
        })
        .catch((err) => console.error("Lỗi tải membership:", err));
    }
  }, [token]);

  // ✅ Khi người dùng thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ✅ Khi chọn ảnh đại diện mới
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    // Preview ảnh ngay lập tức
    const reader = new FileReader();

    reader.onloadend = () => {
      setPreview(reader.result);
    };

    reader.readAsDataURL(file);

    try {
      const res = await uploadAvatar(user._id, file, token);

      if (res.data.avatar) {
        const updated = {
          ...user,
          avatar: res.data.avatar,
        };

        localStorage.setItem("user", JSON.stringify(updated));

        setUser(updated);

        setPreview(`http://localhost:5000${res.data.avatar}`);
      }
    } catch (err) {
      console.error("❌ Upload avatar lỗi:", err);
    }
  };

  // ✅ Lưu thay đổi thông tin
  const handleSave = async () => {
    try {
      const body = {
        name: formData.name,
        phone: formData.phone,
        dob: formData.dob,
        gender: formData.gender,
        studentId: user.studentId
          ? user.studentId
          : formData.studentId,
      };

      const res = await updateUser(user._id, body, token);

      if (res.data) {
        setMessage("✅ Cập nhật thông tin thành công!");

        localStorage.setItem("user", JSON.stringify(res.data));

        setUser(res.data);

        if (res.data.avatar) {
          setPreview(`http://localhost:5000${res.data.avatar}`);
        }
      }
    } catch (err) {
      console.error("❌ Update error:", err);

      const msg =
        err.response?.data?.message ||
        "❌ Cập nhật thất bại, vui lòng thử lại.";

      setMessage(msg);
    }
  };

  return (
    <div className="account-page">
      <h2>Thông tin tài khoản</h2>

      {/* 👑 Membership Status Section */}
      <div
        className={`account-membership-card ${
          membership?.planName === "VIP"
            ? "vip"
            : membership?.planName === "PREMIUM"
            ? "premium"
            : "free"
        }`}
      >
        <div className="am-header">
          <div className="am-title-wrap">
            <span className="am-icon">
              {membership?.planName === "VIP"
                ? "👑"
                : membership?.planName === "PREMIUM"
                ? "⭐"
                : "🎟️"}
            </span>
            <div>
              <h4 className="am-name">
                Hội viên {membership?.displayName || membership?.planName || "FREE"}
              </h4>
              <span className="am-status-badge">
                {membership?.isPaid ? "Đang hoạt động" : "Gói miễn phí"}
              </span>
            </div>
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: "1.1rem",
              color: membership?.badgeColor || "#00E599",
            }}
          >
            {membership?.planName || "FREE"}
          </span>
        </div>

        {membership?.isPaid ? (
          <div className="am-details">
            <div className="am-detail-item">
              <span className="am-detail-label">Ngày bắt đầu</span>
              <span className="am-detail-val">
                {new Date(membership.startDate).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="am-detail-item">
              <span className="am-detail-label">Ngày hết hạn</span>
              <span className="am-detail-val">
                {new Date(membership.endDate).toLocaleDateString("vi-VN")}
              </span>
            </div>
            <div className="am-detail-item">
              <span className="am-detail-label">Còn lại</span>
              <span className="am-detail-val" style={{ color: "#00E599" }}>
                {membership.daysRemaining} ngày
              </span>
            </div>
          </div>
        ) : (
          <p style={{ color: "#94a3b8", fontSize: "0.88rem", margin: 0 }}>
            Nâng cấp Premium/VIP để mua vé sớm hơn 30 phút và giảm đến 10% phí dịch vụ!
          </p>
        )}

        <button
          className="am-upgrade-btn"
          onClick={() => navigate("/membership")}
        >
          {membership?.planName === "VIP"
            ? "👑 Quản lý Gói Hội viên"
            : "✨ Nâng cấp Gói Hội viên"}
        </button>
      </div>

      <div className="account-info">

        {/* 🟠 Ảnh đại diện */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img
              src={
                preview?.startsWith("http")
                  ? preview
                  : `http://localhost:5000${
                      preview ||
                      user.avatar ||
                      "/uploads/default.png"
                    }`
              }
              alt="avatar"
            />

            <label
              htmlFor="avatar-upload"
              className="upload-icon"
            >
              📷
            </label>

            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* 🟠 Form thông tin */}
        <div className="info-fields">

          <label>Họ và tên</label>

          <input
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
          />

          <label>Email</label>

          <input
            name="email"
            type="email"
            value={formData.email}
            disabled
          />

          <label>Số điện thoại</label>

          <input
            name="phone"
            type="text"
            value={formData.phone}
            onChange={handleChange}
          />

          <label>Ngày sinh</label>

          <DatePicker
            selected={
              formData.dob
                ? new Date(formData.dob)
                : null
            }
            onChange={(date) =>
              setFormData({
                ...formData,
                dob: dayjs(date).format("YYYY-MM-DD"),
              })
            }
            dateFormat="dd/MM/yyyy"
            placeholderText="Chọn ngày sinh"
          />

          <label>Giới tính</label>

          <div className="gender-options">
            {["Nam", "Nữ", "Khác"].map((g) => (
              <label key={g}>
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={handleChange}
                />

                {g}
              </label>
            ))}
          </div>

          <label>Mã sinh viên</label>

          <input
            name="studentId"
            type="text"
            value={formData.studentId}
            onChange={handleChange}
            disabled={!!user.studentId}
            placeholder="Nhập mã sinh viên (nếu chưa có)"
          />

          <button
            className="save-btn"
            onClick={handleSave}
          >
            💾 Lưu thay đổi
          </button>

          {message && (
            <p
              className={`status-msg ${
                message.startsWith("✅")
                  ? "success"
                  : "error"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}