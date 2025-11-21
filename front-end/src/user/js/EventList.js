import React from "react";
import { Link } from "react-router-dom";

function EventList({ events, favorites, toggleFavorite }) {
  return (
    <div className="scroll-row">
      {events.map((ev) => (
        <div className="suggest-card" key={ev._id}>
          
          {/* Image */}
          <img
            src={ev.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={ev.title}
          />

          {/* Title */}
          <h4>{ev.title}</h4>

          {/* 📍 Location */}
          <p className="text-sm mt-1" style={{ color: "#ffdd57", fontWeight: 500 }}>
             {ev.locationId || "Chưa có địa điểm"}
          </p>

          {/* 📅 Date */}
          <p className="text-sm mt-1" style={{ color: "#ddd" }}>
             {ev.date ? new Date(ev.date).toLocaleDateString("vi-VN") : "Chưa có ngày"}
          </p>

          {/* View Detail */}
          <Link to={`/event/${ev._id}`}>
            <button className="btn btn-info my-2" style={{
      background: "linear-gradient(90deg, #FF7F50, #FFA500)"}}>View Detail</button>
          </Link>

          {/* ❤️ Favorite */}
          <button
            className={`fav-btn ${favorites.some((f) => f._id === ev._id) ? "active" : ""}`}
            onClick={() => toggleFavorite(ev)}
          >
            {favorites.some((f) => f._id === ev._id) ? "❤️" : "🤍"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default EventList;