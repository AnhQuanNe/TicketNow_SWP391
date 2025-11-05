import React from "react";
import { Link } from "react-router-dom";

function EventList({ events, favorites, toggleFavorite }) {
  return (
    <div className="scroll-row">
      {events.map((ev) => (
        <div className="suggest-card" key={ev._id}>
          <img
            src={ev.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={ev.title}
          />
          <h4>{ev.title}</h4>
          <p>{ev.categoryName || ev.categoryId}</p>

          {/* 🟩 Nút xem chi tiết */}
          <Link to={`/event/${ev._id}`}>
            <button className="btn btn-info my-2">View Detail</button>
          </Link>

          {/* 🩷 Nút tim */}
          <button
            className={`fav-btn ${favorites.some(f => f._id === ev._id) ? "active" : ""}`}
            onClick={() => toggleFavorite(ev)}
          >
            {favorites.some(f => f._id === ev._id) ? "❤️" : "🤍"}
          </button>
        </div>
      ))}
    </div>
  );
}

export default EventList;
