import React from "react";

function EventSection({ title, events, favorites, toggleFavorite }) {
    if (events.length === 0) return null;
  
    return (
      <section className="category-section">
        <div className="section-header">
          <h2>{title}</h2>
          <button className="see-more">Xem thêm</button>
        </div>
        <div className="scroll-row">
          {events.map((ev) => (
            <div className="suggest-card" key={ev.id}>
              <img src={ev.banner} alt={ev.title} />
              <h4>{ev.title}</h4>
              <p>{ev.category}</p>
              <button
                className={`fav-btn ${favorites.includes(ev.id) ? "active" : ""}`}
                onClick={() => toggleFavorite(ev.id)}
              >
                {favorites.includes(ev.id) ? "+" : "+"}
              </button>
            </div>
          ))}
        </div>
      </section>
    );
  }
  export default EventSection;
  