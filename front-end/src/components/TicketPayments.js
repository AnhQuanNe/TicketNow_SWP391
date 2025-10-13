import React from "react";
import { useNavigate } from "react-router-dom";

function TicketPayment() {
  const navigate = useNavigate();

  const event = {
    title: "Sự kiện Âm nhạc 2025",
    image: "https://picsum.photos/600/300",
    description: "Một đêm nhạc hội hoành tráng với các ca sĩ nổi tiếng.",
    tickets: [
      { type: "Thường", price: 100000 },
      { type: "VIP", price: 200000 },
      { type: "Siêu VIP", price: 350000 },
      { type: "Boss Siêu Cấp", price: 500000 },
    ],
  };

  const handleBuyNow = () => {
    navigate("/select-ticket", { state: { event } });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>{event.title}</h2>
      <img
        src={event.image}
        alt="event"
        style={{ width: "100%", borderRadius: "10px" }}
      />
      <p>{event.description}</p>

      <h3>Loại vé:</h3>
      <ul>
        {event.tickets.map((ticket, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            {ticket.type} - {ticket.price.toLocaleString()} VND
          </li>
        ))}
      </ul>

      <button
        onClick={handleBuyNow}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "green",
          color: "white",
          border: "none",
          borderRadius: "5px",
          fontSize: "16px",
        }}
      >
        Mua vé ngay
      </button>
    </div>
  );
}

export default TicketPayment;
