import React, { useState } from "react";
import "../css/UserDropdown.css";

export default function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  if (!user || !user.name) return null;

  const avatarLetter = user.name.charAt(0).toUpperCase();

  return (
    <div
      className="user-dropdown"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* 🔹 Nút chính chứa avatar + tên + mũi tên */}
      <div className="user-button">
        <div className="user-avatar">
          {user.avatar ? (
            <img src={user.avatar} alt="avatar" />
          ) : (
            <div className="avatar-placeholder">{avatarLetter}</div>
          )}
        </div>
        <span className="user-name">{user.name}</span>
        <span className="arrow-down">▼</span>
      </div>

      {/* 🔹 Menu thả xuống */}
      <div className={`dropdown-menu ${open ? "open" : ""}`}>
        <ul>
          <li>🎟 Vé của tôi</li>
          <li>⭐ Sự kiện của tôi</li>
          <li>👤 Tài khoản của tôi</li>
          <li onClick={onLogout}>🚪 Đăng xuất</li>
        </ul>
      </div>
    </div>
  );
}
