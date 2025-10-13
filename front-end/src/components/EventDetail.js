import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { demoEvents } from "../share/data";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = demoEvents.find((ev) => ev.id === parseInt(id));

  if (!event) {
    return <h2 style={{ textAlign: "center", marginTop: "50px" }}>Sự kiện không tồn tại</h2>;
  }

  const handleBuyTicket = () => {
    navigate(`/ticket/${id}`); // chuyển qua trang chọn vé
  };

  return (
    <div style={{ padding: "30px", background: "#121212", color: "#fff" }}>
      <h1>{event.title}</h1>
      <p><strong>⏰</strong> {event.time}</p>
      <p><strong>📍</strong> {event.location}</p>
      <h2 style={{ margin: "20px 0", color: "#1db954" }}>Vé chỉ từ 100.000đ</h2>

      <button
        onClick={handleBuyTicket}
        style={{
          padding: "12px 24px",
          background: "#1db954",
          border: "none",
          borderRadius: "8px",
          color: "#fff",
          fontSize: "18px",
          cursor: "pointer",
        }}
      >
        🎟️ Mua vé ngay
      </button>

      <div style={{ marginTop: "20px" }}>
        <img src={event.banner} alt={event.title} style={{ width: "100%", maxWidth: "600px", borderRadius: "12px" }} />
      </div>
    </div>
  );
}

export default EventDetail;
