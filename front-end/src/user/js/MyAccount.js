import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/MyAccount.css";

export default function MyAccount() {
  const [user, setUser] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    studentId: "",
    avatarFile: null,
  });
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");
  const token = localStorage.getItem("token");

  // ✅ Lấy thông tin user từ localStorage khi vào trang
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      setUser(savedUser);
      setFormData({
        name: savedUser.name || "",
        email: savedUser.email || "",
        phone: savedUser.phone || "",
        studentId: savedUser.studentId || "",
        avatarFile: null,
      });
      setPreview(
        savedUser.avatar
          ? `http://localhost:5000${savedUser.avatar}`
          : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      );
    }
  }, []);

  // ✅ Khi người dùng nhập vào input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Khi người dùng chọn ảnh mới (chỉ preview, chưa upload)
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setFormData({ ...formData, avatarFile: file });
    };
    reader.readAsDataURL(file);
  };

  // ✅ Khi nhấn "Lưu thay đổi"
  const handleSave = async () => {
    try {
      // 🟢 1️⃣ Gửi thông tin text (name, studentId)
      const info = {
        name: formData.name,
        studentId: user.studentId ? user.studentId : formData.studentId,
      };

      await axios.put(
        `http://localhost:5000/api/users/${user._id}`,
        info,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 🟠 2️⃣ Nếu có chọn ảnh mới → upload qua API riêng
      if (formData.avatarFile) {
        const fileData = new FormData();
        fileData.append("avatar", formData.avatarFile);

        const res = await axios.put(
          `http://localhost:5000/api/users/${user._id}/avatar`,
          fileData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (res.data.avatar) {
          const updated = { ...user, avatar: res.data.avatar, name: formData.name };
          localStorage.setItem("user", JSON.stringify(updated));
          setUser(updated);
          setPreview(`http://localhost:5000${res.data.avatar}`);
        }
      } else {
        // Nếu không có ảnh mới, chỉ cập nhật name
        const updated = { ...user, name: formData.name };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
      }

      setMessage("✅ Cập nhật thông tin thành công!");
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      setMessage("❌ Cập nhật thất bại, vui lòng thử lại.");
    }
  };

  return (
    <div className="account-page">
      <h2>Thông tin tài khoản</h2>

      <div className="account-info">
        {/* 🟠 Ảnh đại diện */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img src={preview} alt="avatar" />
            <label htmlFor="avatar-upload" className="upload-icon">
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
          <input name="email" type="email" value={formData.email} disabled />

          <label>Số điện thoại</label>
          <input name="phone" type="text" value={formData.phone} disabled />

          <label>Mã sinh viên</label>
          <input
            name="studentId"
            type="text"
            value={formData.studentId}
            onChange={handleChange}
            disabled={!!user.studentId}
            placeholder="Nhập mã sinh viên (nếu chưa có)"
          />

          <button className="save-btn" onClick={handleSave}>
            💾 Lưu thay đổi
          </button>

          {message && <p className="status-msg">{message}</p>}
        </div>
      </div>
    </div>
  );
}
