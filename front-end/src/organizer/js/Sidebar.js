import React, { useState } from "react";
import {
  FaChartBar,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaTicketAlt,
  FaUsers,
  FaBell,
  FaChartLine,
} from "react-icons/fa";
import "../css/Sidebar.css";
import { useNavigate } from "react-router-dom";

function Sidebar({ setActivePage, activePage }) {
  const navigate = useNavigate();
  const [showDashboardSub, setShowDashboardSub] = useState(false);

  const handleLogout = () => {
    // Xóa dữ liệu đăng nhập nếu có
    localStorage.removeItem("organizer");
    // Chuyển về homepage
    navigate("/");
  };

  const toggleDashboardSub = () => {
    setShowDashboardSub((s) => !s);
  };

  const dashboardPages = [
    "dashboard",
    "my-events",
    "reports",
    "notifications",
  ];

  const onSelect = (page) => {
    setActivePage(page);
    // Nếu chọn một trang thuộc Dashboard group thì giữ submenu mở,
    // ngược lại đóng nó.
    if (dashboardPages.includes(page)) {
      setShowDashboardSub(true);
    } else {
      setShowDashboardSub(false);
    }
  };

  return (
    <div className="organizer-sidebar">
      <h2 className="sidebar-title">TicketNow</h2>
      <ul className="sidebar-menu">
        <li onClick={() => onSelect("rules")} className={activePage === "rules" ? "active" : ""}>
          <FaFileAlt /> <span>Quy định</span>
        </li>

        <li className={`dashboard-item ${activePage.startsWith("dashboard") ? "active" : ""}`}>
          <button type="button" className="dashboard-toggle" onClick={() => onSelect("dashboard")}>
            <FaChartBar /> <span>Dashboard</span> <FaChevronDown className={`chev ${showDashboardSub ? "open" : ""}`} />
          </button>

          {showDashboardSub && (
            <ul className="submenu">
              {/* 'Tổng quan' removed per request; Dashboard is accessible via the top-level row */}
              <li onClick={() => onSelect("my-events")} className={activePage === "my-events" ? "active" : ""}>
                <FaCalendarAlt /> My Events
              </li>
              <li onClick={() => onSelect("reports")} className={activePage === "reports" ? "active" : ""}>
                <FaChartLine /> Reports
              </li>
              <li onClick={() => onSelect("notifications")} className={activePage === "notifications" ? "active" : ""}>
                <FaBell /> Notifications
              </li>
            </ul>
          )}
        </li>

        <li onClick={() => onSelect("create-event")} className={activePage === "create-event" ? "active" : ""}>
          <FaCalendarAlt /> Tạo sự kiện
        </li>

        <li onClick={() => onSelect("profile")} className={activePage === "profile" ? "active" : ""}>
          <FaUser /> Hồ sơ
        </li>

        <li className="logout" onClick={handleLogout}>
          <FaSignOutAlt /> Đăng xuất
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
