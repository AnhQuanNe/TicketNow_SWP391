// 📄 OrganizerLayout.js
// 👉 Đây là layout chính cho giao diện Organizer (Ban tổ chức sự kiện)

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import EventRequestForm from "./EventRequest";
import Profile from "./Profile";
import OrganizerRule from "./OrganizerRule";
import "../css/organizer.css";

function OrganizerLayout() {
  // 🟢 State dùng để xác định trang hiện tại trong layout
  const [activePage, setActivePage] = useState("rules");

  // 🟢 Hàm hiển thị nội dung chính tuỳ theo trang đang chọn
  const renderContent = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard />;
      case "my-events":
        return <EventRequestForm />;
      case "profile":
        return <Profile />;
      case "rules":
      default:
        return <OrganizerRule />;
    }
  };

  return (
    <div className="organizer-layout">
      {/* 🟩 Sidebar hiển thị menu điều hướng, nhận setActivePage để thay đổi trang */}
      <Sidebar setActivePage={setActivePage} activePage={activePage} />

      {/* 🟦 Khu vực nội dung chính */}
      <div className="organizer-main">
        <main className="organizer-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default OrganizerLayout;
