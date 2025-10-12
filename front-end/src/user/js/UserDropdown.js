import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserDropdown.css";

export default function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const goToAccount = () => {
    navigate("/my-account");
    setOpen(false); // ẩn menu khi nhấn
  };

  return (
    <div
      className="user-dropdown"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div className="user-button">
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt="avatar" />
          ) : (
            <div className="avatar-placeholder">{user.name[0]}</div>
          )}
        </div>
        <span className="user-name">{user.name}</span>
        <span className="arrow-down">▼</span>
      </div>

      <div className={`dropdown-menu ${open ? "open" : ""}`}>
        <ul>
          <li>🎟 Vé của tôi</li>
          <li>⭐ Sự kiện của tôi</li>
          <li onClick={goToAccount}>👤 Tài khoản của tôi</li> {/* ✅ thêm điều hướng */}
          <li onClick={onLogout}>🚪 Đăng xuất</li>
        </ul>
      </div>
    </div>
  );
}
