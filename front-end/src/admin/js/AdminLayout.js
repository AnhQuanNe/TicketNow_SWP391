import React from "react";
import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import "../css/Admin.css";

export default function AdminLayout() {
  const location = useLocation();

  const getPageTitle = () => {
    const titles = {
      "/admin": "Dashboard",
      "/admin/users": "Quản lý Người Dùng",
      "/admin/events": "Quản lý Sự kiện",
      "/admin/reports": "Báo cáo & Thống kê",
      "/admin/notifications": "Thông báo",
    };
    return titles[location.pathname] || "Dashboard";
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Header title={getPageTitle()} />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
