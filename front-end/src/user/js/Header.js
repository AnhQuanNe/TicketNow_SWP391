import React, { useState } from "react";

function Header({ onSearch, searchTerm }) {   // ✅ Nhận props từ cha
  const [showModal, setShowModal] = useState(null); // null | "login" | "register"

  const openModal = type => setShowModal(type);
  const closeModal = () => setShowModal(null);

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
        {/* ✅ Khi người dùng gõ, gọi onSearch */}
        <input
          type="text"
          placeholder="Tìm kiếm sự kiện..."
          className="search-input"
          onChange={(e) => onSearch(e.target.value)}  // 🔥 Thêm dòng này
        />
        <div className="auth-links">
          <button className="auth-link" onClick={() => openModal("login")}>Đăng nhập</button>
          <span className="divider">|</span>
          <button className="auth-link" onClick={() => openModal("register")}>Đăng ký</button>
        </div>
      </div>

      {/* Modal Overlay */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            {showModal === "login" && <h2>Đăng nhập</h2>}
            {showModal === "register" && <h2>Đăng ký</h2>}
            {/* Form login/register */}
            <form>
              <input type="text" placeholder="Tên đăng nhập" />
              <input type="password" placeholder="Mật khẩu" />
              <button type="submit">{showModal === "login" ? "Đăng nhập" : "Đăng ký"}</button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
