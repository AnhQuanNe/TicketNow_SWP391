import React from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Heart } from "lucide-react";

// Format tiền tệ Việt Nam
const formatPrice = (ev) => {
  if (ev.price) {
    return `Từ ${Number(ev.price).toLocaleString("vi-VN")}đ`;
  }
  if (ev.regularPrice) {
    return `Từ ${Number(ev.regularPrice).toLocaleString("vi-VN")}đ`;
  }
  if (ev.studentPrice) {
    return `Từ ${Number(ev.studentPrice).toLocaleString("vi-VN")}đ`;
  }
  return "Từ 150.000đ";
};

// Format ngày tiếng Việt
const formatDate = (dateString) => {
  if (!dateString) return "Sắp diễn ra";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Sắp diễn ra";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day} tháng ${month}, ${year}`;
  } catch {
    return "Sắp diễn ra";
  }
};

function EventList({ events = [], favorites = [], toggleFavorite, variant = "standard" }) {
  if (!events || events.length === 0) {
    return <div className="no-events-text">Chưa có sự kiện nào trong mục này.</div>;
  }

  // 1️⃣ DẠNG POSTER ĐỨNG (Sự kiện đặc biệt)
  if (variant === "portrait") {
    return (
      <div className="portrait-scroll-row">
        {events.map((ev) => {
          const isFav = favorites.some((f) => f._id === ev._id);
          return (
            <div className="portrait-card" key={ev._id}>
              <Link to={`/event/${ev._id}`} className="portrait-link">
                <div className="portrait-img-wrap">
                  <img
                    src={ev.imageUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=600&q=80"}
                    alt={ev.title}
                    loading="lazy"
                  />
                  <div className="portrait-overlay">
                    <h5 className="portrait-title">{ev.title}</h5>
                    <span className="portrait-date">{formatDate(ev.date)}</span>
                  </div>
                </div>
              </Link>

              <button
                className={`card-fav-btn ${isFav ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(ev);
                }}
                title={isFav ? "Bỏ yêu thích" : "Yêu thích"}
              >
                <Heart size={18} fill={isFav ? "#ff4d6d" : "transparent"} color={isFav ? "#ff4d6d" : "#ffffff"} />
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  // 2️⃣ DẠNG XU HƯỚNG CÓ SỐ TOP 1, 2, 3, 4 (Trending Top Charts)
  if (variant === "trending") {
    return (
      <div className="trending-scroll-row">
        {events.slice(0, 5).map((ev, idx) => {
          const isFav = favorites.some((f) => f._id === ev._id);
          return (
            <div className="trending-card" key={ev._id}>
              {/* Số thứ tự lớn phát sáng */}
              <div className="trending-rank-number">
                {idx + 1}
              </div>

              {/* Card bên cạnh số */}
              <div className="trending-content-card">
                <Link to={`/event/${ev._id}`} className="trending-img-link">
                  <div className="trending-img-wrap">
                    <img
                      src={ev.imageUrl || "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=600&q=80"}
                      alt={ev.title}
                      loading="lazy"
                    />
                  </div>
                </Link>

                <div className="trending-info">
                  <Link to={`/event/${ev._id}`}>
                    <h4 className="trending-title" title={ev.title}>{ev.title}</h4>
                  </Link>
                  <div className="trending-meta">
                    <span className="trending-price">{formatPrice(ev)}</span>
                    <span className="trending-date">
                      <Calendar size={13} /> {formatDate(ev.date)}
                    </span>
                  </div>
                </div>

                <button
                  className={`card-fav-btn ${isFav ? "active" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFavorite(ev);
                  }}
                >
                  <Heart size={16} fill={isFav ? "#ff4d6d" : "transparent"} color={isFav ? "#ff4d6d" : "#ffffff"} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // 3️⃣ DẠNG CHUẨN NGANG 16:9 (Cuối tuần này / Nhạc sống / Sân khấu nghệ thuật)
  return (
    <div className="standard-event-grid">
      {events.map((ev) => {
        const isFav = favorites.some((f) => f._id === ev._id);
        return (
          <div className="standard-event-card" key={ev._id}>
            {/* Ảnh sự kiện */}
            <div className="card-thumb-wrap">
              <Link to={`/event/${ev._id}`} className="thumb-link">
                <img
                  src={ev.imageUrl || "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80"}
                  alt={ev.title}
                  loading="lazy"
                />
              </Link>

              {/* Nút yêu thích kính mờ */}
              <button
                className={`card-fav-btn ${isFav ? "active" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(ev);
                }}
              >
                <Heart size={16} fill={isFav ? "#ff4d6d" : "transparent"} color={isFav ? "#ff4d6d" : "#ffffff"} />
              </button>
            </div>

            {/* Chi tiết sự kiện */}
            <div className="card-body-content">
              <Link to={`/event/${ev._id}`}>
                <h4 className="event-card-title" title={ev.title}>
                  {ev.title}
                </h4>
              </Link>

              {/* Giá vé màu Emerald */}
              <div className="event-card-price">
                {formatPrice(ev)}
              </div>

              {/* Ngày tháng */}
              <div className="event-card-date">
                <Calendar size={13} className="date-icon" />
                <span>{formatDate(ev.date)}</span>
              </div>

              {/* Địa điểm (nếu có) */}
              {ev.locationId && (
                <div className="event-card-location">
                  <MapPin size={12} className="loc-icon" />
                  <span className="loc-text">{ev.locationId}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default EventList;