import React from "react";
import { FaChartBar, FaCalendarAlt, FaUser, FaFileAlt, FaSignOutAlt } from "react-icons/fa";
import "../css/Sidebar.css";
import { useNavigate } from "react-router-dom";

function Sidebar({ setActivePage }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xóa dữ liệu đăng nhập nếu có
    localStorage.removeItem("organizer");
    // Chuyển về homepage
    navigate("/");
  };

  return (
    <div className="organizer-sidebar">
      <h2 className="sidebar-title">TicketNow</h2>
      <ul className="sidebar-menu">
      <li onClick={() => setActivePage("rules")}>
          <FaFileAlt /> Quy định
        </li>
        <li onClick={() => setActivePage("dashboard")}>
          <FaChartBar /> Dashboard
        </li>
        <li onClick={() => setActivePage("my-events")}>
          <FaCalendarAlt /> Tạo sự kiện
        </li>
        <li onClick={() => setActivePage("profile")}>
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
