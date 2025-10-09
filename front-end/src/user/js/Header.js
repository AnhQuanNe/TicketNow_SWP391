import React, { useState } from "react";
import LoginRegisterModal from "./LoginRegisterModal";
import "../css/Header.css";

function Header({ onSearch, searchTerm }) {
  const [showModal, setShowModal] = useState(null); // null | "login" | "register"
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const openModal = (type) => setShowModal(type);
  const closeModal = () => setShowModal(null);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <header>
      <div className="brand">
        <div className="logo">TN</div>
        <div>
          <div>TicketNow</div>
          <div className="subtitle">Your Events, One Click Away</div>
        </div>
      </div>

      <div className="search-login">
        <input
          type="text"
          placeholder="Tìm kiếm sự kiện..."
          className="search-input"
          onChange={(e) => onSearch(e.target.value)}
        />
        <div className="auth-links">
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <button className="auth-link" onClick={() => openModal("login")}>
                Đăng nhập
              </button>
              <span className="divider">|</span>
              <button
                className="auth-link"
                onClick={() => openModal("register")}
              >
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>

      {/* ✅ Dùng modal riêng thay cho modal cũ */}
      {showModal && (
        <LoginRegisterModal
          type={showModal}
          onClose={closeModal}
          switchType={openModal}
          onLoginSuccess={(data) => {
            setUser(data); // ✅ cập nhật tên hiển thị
            localStorage.setItem("user", JSON.stringify(data)); // ✅ lưu vào localStorage
          }}
        />
      )}
    </header>
  );
}

export default Header;
