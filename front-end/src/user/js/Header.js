import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // click trỏ logo
import LoginRegisterModal from "./LoginRegisterModal";
import "../css/Header.css";
import UserDropdown from "./UserDropdown";

function Header({ onSearch, searchTerm }) {
  const [showModal, setShowModal] = useState(null); // null | "login" | "register"
  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );
  useEffect(() => {
  // Khi localStorage thay đổi (user đổi avatar, tên)
  const handleStorageChange = () => {
    const updatedUser = JSON.parse(localStorage.getItem("user"));
    setUser(updatedUser);
  };

  window.addEventListener("storage", handleStorageChange);
  return () => window.removeEventListener("storage", handleStorageChange);
}, []);

  const openModal = (type) => setShowModal(type);
  const closeModal = () => setShowModal(null);
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/"); // điều hướng về trang home
  };

  const goHome = () => {
    navigate("/"); // điều hướng về trang home
  };

  return (
    <header>
      <div className="brand">
        <div className="logo" onClick={goHome}>
          TN
        </div>
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
          {user && user.name ? (
            <UserDropdown user={user} onLogout={handleLogout} />
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
