import React from "react";
import EventList from "./EventList"; 

function EventSection({ title, events, favorites, toggleFavorite }) {
  return (
    <section className="event-section">
      <h2>{title}</h2>
      {!events || events.length === 0 ? (
        <p>Không có sự kiện</p>
      ) : (
        // Sử dụng EventList để hiển thị danh sách
        <EventList 
          events={events} 
          favorites={favorites} 
          toggleFavorite={toggleFavorite} 
        />
      )}
    </section>
  );
}

export default EventSection;