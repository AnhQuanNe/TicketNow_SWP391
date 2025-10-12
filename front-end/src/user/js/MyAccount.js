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
    avatar: "",
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
        avatar: savedUser.avatar || "",
      });
      setPreview(savedUser.avatar || "");
    }
  }, []);

  // ✅ Khi người dùng nhập vào input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Khi người dùng chọn ảnh mới
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result); // hiển thị ảnh trước
      setFormData({ ...formData, avatar: reader.result }); // lưu base64
    };
    reader.readAsDataURL(file);
  };

  // ✅ Gửi dữ liệu lên backend
  const handleSave = async () => {
    try {
      const body = {
        name: formData.name,
        avatar: formData.avatar,
        // ⚙️ chỉ gửi studentId nếu chưa có
        studentId: user.studentId ? user.studentId : formData.studentId,
      };

      const res = await axios.put(
        `http://localhost:5000/api/users/${user._id}`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data) {
        setMessage("✅ Cập nhật thông tin thành công!");
        localStorage.setItem("user", JSON.stringify(res.data));
        setUser(res.data);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
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
            <img
              src={
                preview ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="avatar"
            />
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
