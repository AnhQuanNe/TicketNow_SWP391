// 📄 OrganizerLayout.js
// 👉 Đây là layout chính cho giao diện Organizer (Ban tổ chức sự kiện)

import React, { useState } from "react";
import Sidebar from "./Sidebar";

import EventRequestForm from "./EventRequest";
import Profile from "./Profile";
import OrganizerRule from "./OrganizerRule";
import MyEventsList from "./MyEventsList";
import Reports from "./Reports";
import OrganizerEventDetail from "./OrganizerEventDetail";
import "../css/organizer.css";
import CheckinPage from "./CheckinPage";
function OrganizerLayout() {

  const [activePage, setActivePage] = useState("rules");
  // id của event đang được xem chi tiết
  const [selectedEventId, setSelectedEventId] = useState(null);

  const renderContent = () => {
    switch (activePage) {
      case "my-events":
        return <MyEventsList setActivePage={setActivePage} setSelectedEventId={setSelectedEventId} />;
      case "event-detail":
        return <OrganizerEventDetail eventId={selectedEventId} setActivePage={setActivePage} />;
      case "reports":
        return <Reports />;
      case "create-event":
        return <EventRequestForm />;
      case "profile":
        return <Profile />;
        case "checkin":
        return <CheckinPage />;   // ⭐ THÊM DÒNG NÀY
      
      case "rules":
      default:
        return <OrganizerRule />;
    }
  };

  return (
    <div className="organizer-layout">
      <Sidebar setActivePage={setActivePage} activePage={activePage} />

      <div className="organizer-main">
        <main className="organizer-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default OrganizerLayout;
