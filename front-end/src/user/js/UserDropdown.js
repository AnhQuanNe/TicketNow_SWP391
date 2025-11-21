import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/UserDropdown.css";

export default function UserDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  // vao phan ve cua toi
  const goToTickets = () => {
  navigate("/my-tickets");
  setOpen(false);
};


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
            <img
              src={
                user?.avatar?.startsWith("http")
                  ? user.avatar
                  : user?.avatar
                  ? `http://localhost:5000${user.avatar}`
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt="avatar"
              className="user-avatar"
            />
          ) : (
            <div className="avatar-placeholder">{user.name[0]}</div>
          )}
        </div>
        <span className="user-name">{user.name}</span>
        <span className="arrow-down">▼</span>
      </div>

      <div className={`dropdown-menu ${open ? "open" : ""}`}>
        <ul>
          <li onClick={goToTickets}> Vé của tôi</li>
         
         
          <li onClick={() => navigate("/favorites")}> Sự kiện của tôi</li> {/* ✅ thêm điều hướng đúng */}
          <li onClick={goToAccount}> Tài khoản của tôi</li>{" "}
          {/* ✅ thêm điều hướng */}
          <li onClick={onLogout}> Đăng xuất</li>
        </ul>
      </div>
    </div>
  );
}
