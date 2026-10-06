import React, { useState, useEffect } from "react";
import "../../App.css";
import "../css/Banner.css";
import { getEvents } from "../../api/eventApi";

function Banner({ bannerIndex, nextBanner, prevBanner, selectBanner }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        console.error("Lỗi fetch:", err);
      }
    };

    loadEvents();
  }, []);

  if (events.length === 0) {
    return <div className="no-banner">Không có sự kiện</div>;
  }

  const currentEvent = events[bannerIndex % events.length];

  return (
    <div className="banner">
      {/* Nút điều hướng */}
      <button className="banner-btn prev" onClick={prevBanner}>
        &lt;
      </button>

      {/* Ảnh banner */}
      <img
        src={currentEvent.imageUrl}
        alt={currentEvent.title}
        className="banner-img"
      />

      {/* Overlay chữ */}
      <div className="banner-overlay">
        <a href={`/event/${currentEvent._id}`} className="banner-link">
          Xem chi tiết
        </a>
      </div>

      {/* Nút điều hướng */}
      <button className="banner-btn next" onClick={nextBanner}>
        &gt;
      </button>

      {/* Dấu chấm chỉ vị trí */}
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