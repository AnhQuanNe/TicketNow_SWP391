import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // click trỏ logo
import LoginRegisterModal from "./LoginRegisterModal";
import "../css/Header.css";
import UserDropdown from "./UserDropdown";
import Notification from "./Notification";
import ReactDOM from "react-dom";

function Header() {
  const [showModal, setShowModal] = useState(null); // null | "login" | "register"
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [user, setUser] = useState(() => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error("Invalid user JSON in localStorage:", e);
    localStorage.removeItem("user"); // ✅ Xóa dữ liệu lỗi
    return null;
  }
});

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

  const handleSearchSubmit = (e) => {
  if (e.key === "Enter") {
    e.preventDefault(); // ✅ Ngăn reload trang
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`); // ✅ encode URL an toàn hơn
    }
  }
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
        />
        {/* 🔔 Notification between search and auth */}
        <Notification user={user} />
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
      {showModal &&
        ReactDOM.createPortal(
          <LoginRegisterModal
            type={showModal}
            onClose={closeModal}
            switchType={openModal}
            onLoginSuccess={(data) => {
              setUser(data);
              localStorage.setItem("user", JSON.stringify(data));
            }}
          />,
          document.body // ✅ render modal ra ngoài header, phủ full trang
        )}
    </header>
  );
}

export default Header;
