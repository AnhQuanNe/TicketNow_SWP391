import React, { useEffect, useState } from "react";
import axios from "axios";


export default function MyTickets() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId"); // hoặc lấy từ context
    axios
      .get(`http://localhost:5000/api/tickets/user/${userId}`)
      .then((res) => setTickets(res.data))
      .catch((err) => console.error("Lỗi tải vé:", err));
  }, []);

  return (
    <div className="my-tickets-container">
      <h2>🎟 Vé của tôi</h2>
      {tickets.length === 0 ? (
        <p>Bạn chưa mua vé nào.</p>
      ) : (
        <ul className="ticket-list">
          {tickets.map((t) => (
            <li key={t._id} className="ticket-item">
              <h3>{t.eventName}</h3>
              <p>Ngày: {t.date}</p>
              <p>Số lượng: {t.quantity}</p>
              <p>Giá: {t.price}₫</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
