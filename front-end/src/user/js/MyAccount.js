import React, { useState, useEffect } from "react";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";
import "../css/MyAccount.css";

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
  }, []);

  // ✅ Khi người dùng thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ Khi chọn ảnh đại diện mới
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.append("avatar", file);

    try {
      const res = await axios.put(
        `http://localhost:5000/api/users/${user._id}/avatar`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.avatar) {
        const updated = { ...user, avatar: res.data.avatar };
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
        if (res.data.avatar)
          setPreview(`http://localhost:5000${res.data.avatar}`);
      }
    } catch (err) {
      console.error("❌ Update error:", err);

      // ⚠️ Hiển thị thông báo thật từ backend nếu có
      const msg =
        err.response?.data?.message ||
        "❌ Cập nhật thất bại, vui lòng thử lại.";

      setMessage(msg);
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
                preview?.startsWith("http")
                  ? preview
                  : `http://localhost:5000${
                      preview || user.avatar || "/uploads/default.png"
                    }`
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
          <input
            name="phone"
            type="text"
            value={formData.phone}
            onChange={handleChange}
          />

          <label>Ngày sinh</label>
          <DatePicker
            selected={formData.dob ? new Date(formData.dob) : null}
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

          <button className="save-btn" onClick={handleSave}>
            💾 Lưu thay đổi
          </button>

          {message && (
            <p
              className={`status-msg ${
                message.startsWith("✅") ? "success" : "error"
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
