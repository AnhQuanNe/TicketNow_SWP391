import React, { useState, useEffect } from "react";
import "../../App.css";
import "../css/Banner.css";

function Banner({ bannerIndex, nextBanner, prevBanner, selectBanner }) {
  const [events, setEvents] = useState([]);

  // 🟢 Gọi API featured để lấy 3–5 sự kiện cho banner
  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/events/featured`)
      .then((res) => res.json())
      .then((data) => setEvents(data))
      .catch((err) => console.error("Lỗi fetch:", err));
  }, []);

  // 🟢 Nếu chưa có API featured, dùng tạm /search
  // useEffect(() => {
  //   fetch(`${process.env.REACT_APP_API_URL}/events/search`)
  //     .then((res) => res.json())
  //     .then((data) => setEvents(data.slice(0, 5))) // lấy 5 sự kiện đầu tiên
  //     .catch((err) => console.error("Lỗi fetch:", err));
  // }, []);

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