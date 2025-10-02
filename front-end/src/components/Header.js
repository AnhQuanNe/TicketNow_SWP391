import React from "react";

function Header() {
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
        />
        <div className="auth-links">
          <a href="#">Đăng nhập</a>
          <span className="divider">|</span>
          <a href="#">Đăng ký</a>
        </div>
      </div>
    </header>
  );
}

export default Header;
