import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserDropdown.css";

export default function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Bấm nút để mở/đóng và GIỮ NGUYÊN trạng thái (không bị mất khi di chuột)
  const toggleDropdown = (e) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  // Click ra ngoài màn hình thì mới đóng menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogoutClick = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <div className="user-dropdown" ref={dropdownRef}>
      {/* Nút bấm tên & avatar */}
      <div
        className={`user-button ${open ? "active" : ""}`}
        onClick={toggleDropdown}
      >
        <div className="user-avatar">
          {user?.avatar ? (
            <img
              src={
                user.avatar.startsWith("http")
                  ? user.avatar
                  : `http://localhost:5000${user.avatar}`
              }
              alt="avatar"
              className="user-avatar-img"
            />
          ) : (
            <div className="avatar-placeholder">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
          )}
        </div>
        <span className="user-name">{user?.name || "Người dùng"}</span>
        <span className={`arrow-down ${open ? "rotated" : ""}`}>▼</span>
      </div>

      {/* Menu thả xuống */}
      <div className={`dropdown-menu ${open ? "open" : ""}`}>
        <ul>
          <li onClick={() => handleNavigate("/my-tickets")}>
            <span className="menu-icon">🎟️</span> Vé của tôi
          </li>
          <li onClick={() => handleNavigate("/favorites")}>
            <span className="menu-icon">❤️</span> Sự kiện yêu thích
          </li>
          <li onClick={() => handleNavigate("/my-account")}>
            <span className="menu-icon">👤</span> Tài khoản của tôi
          </li>
          <li onClick={() => handleNavigate("/membership")}>
            <span className="menu-icon">👑</span> Gói Hội viên
          </li>
          <li onClick={handleLogoutClick} className="logout-item">
            <span className="menu-icon">🚪</span> Đăng xuất
          </li>
        </ul>
      </div>
    </div>
  );
}
