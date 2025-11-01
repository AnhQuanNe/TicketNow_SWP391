import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import EventRequestForm from "./EventRequest";
import Profile from "./Profile";
import OrganizerRule from "./OrganizerRule";

import "../css/organizer.css";

function OrganizerLayout() {
  const [activePage, setActivePage] = useState("rules");

  return (
    <div className="organizer-layout">
      <Sidebar setActivePage={setActivePage} />
      <div className="organizer-main">
        <main className="organizer-content">
        {activePage === "rules" && <OrganizerRule />}
          {activePage === "dashboard" && <Dashboard />}
          {activePage === "my-events" && <EventRequestForm />} 
          {activePage === "profile" && <Profile />}
        </main>
      </div>
    </div>
  );
}

export default OrganizerLayout;
//js
