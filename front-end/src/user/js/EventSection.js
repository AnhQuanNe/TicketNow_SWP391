import React from "react";

function EventSection({ title, events, favorites, toggleFavorite }) {
  if (!events || events.length === 0) {
    return (
      <section className="event-section">
        <h2>{title}</h2>
        <p>Không có sự kiện</p>
      </section>
    );
  }

  return (
    <section className="event-section">
      <h2>{title}</h2>
      <div className="scroll-row">
        {events.map(ev => (
          <div className="suggest-card" key={ev._id}>
            <img src={ev.banner} alt={ev.title} />
            <h4>{ev.title}</h4>
            <p>{ev.categoryName || ev.categoryId}</p>
            <button
              className={`fav-btn ${favorites.includes(ev._id) ? "active" : ""}`}
              onClick={() => toggleFavorite(ev._id)}
            >
              {favorites.includes(ev._id) ? "❤️" : "🤍"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default EventSection;
