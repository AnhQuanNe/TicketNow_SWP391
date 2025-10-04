import React from "react";

function Favorites({ events, favorites, toggleFavorite }) {
    if (!events || events.length===0 || favorites.length === 0) return null;
  
    return (
      <section className="favorites-section">
        <div className="section-header"><h2>Dành cho bạn</h2></div>
        <div className="scroll-row">
          {events
            .filter((ev) => favorites.includes(ev.id))
            .map((ev) => (
              <div className="suggest-card" key={ev.id}>
                <img src={ev.banner} alt={ev.title} />
                <h4>{ev.title}</h4>
                <p>{ev.category}</p>
                <button
                  className={`fav-btn ${favorites.includes(ev.id) ? "active" : ""}`}
                  onClick={() => toggleFavorite(ev.id)}
                >
                  {favorites.includes(ev.id) ? "❤️" : "🤍"}
                </button>
              </div>
            ))}
        </div>
      </section>
    );
  }
  export default Favorites;
  