import React, { useState, useEffect } from "react";
import "/App.css"
function Banner({ bannerIndex, nextBanner, prevBanner, selectBanner }) {
  const [events, setEvents] = useState([]);

  // gọi API khi component load
  useEffect(() => {
    fetch("http://localhost:5000/api/events")
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Lỗi fetch:", err));
  }, []);

  return (
    <div className="banner">
      <button className="banner-btn prev" onClick={prevBanner}>&lt;</button>
      {events.length > 0 ? (
        <img src={events[bannerIndex].banner} alt={`Banner ${bannerIndex + 1}`} />
      ) : (
        <div className="no-banner">Không có sự kiện</div>
      )}
      <button className="banner-btn next" onClick={nextBanner}>&gt;</button>

      <div className="banner-dots">
        {events.map((_, idx) => (
          <span
            key={idx}
            className={`dot ${idx === bannerIndex ? "active" : ""}`}
            onClick={() => selectBanner(idx)}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default Banner;
