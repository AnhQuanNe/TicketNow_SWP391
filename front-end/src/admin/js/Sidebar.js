import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../css/Sidebar.css";

export default function Sidebar() {
  const location = useLocation();
  // const navigate = useNavigate();

  const menuItems = [
    { id: "home", path: "/admin", icon: "", label: "" },
    { id: "customers", path: "/admin/users", icon: "", label: "Users" },
    { id: "events", path: "/admin/events", icon: "", label: "Events" },
    { id: "reports", path: "/admin/reports", icon: "", label: "Reports" },
    {
      id: "notifications",
      path: "/admin/notifications",
      icon: "",
      label: "Notifications",
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc muốn đăng xuất?")) {
      // 🧹 Xóa toàn bộ dữ liệu đăng nhập trong localStorage và sessionStorage
      localStorage.removeItem("adminToken");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("adminInfo");
      sessionStorage.clear();

      // 🔁 Reload lại trang để reset context và về trang chủ
      window.location.href = "/";
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img
          src={require("../../assets/logo.png")}
          alt="TicketNow Logo"
          className="logo-img"
        />
        <span className="logo-text">TicketNow</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`menu-item ${
              location.pathname === item.path ? "active" : ""
            }`}
          >
            <span className="menu-item-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="menu-item-icon">⎋</span>
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
