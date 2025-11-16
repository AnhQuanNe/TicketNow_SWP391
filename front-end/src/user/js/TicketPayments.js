import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function SelectTicket() {
  const location = useLocation();
  const navigate = useNavigate();
  const event = location.state?.event;

  const [tickets, setTickets] = useState([]);
  const [quantities, setQuantities] = useState({});

  // 🔹 Lấy danh sách vé từ database
  useEffect(() => {
    if (!event) return;
    fetch(`${process.env.REACT_APP_API_URL}/tickets?eventId=${event._id}`)
      .then((res) => res.json())
      .then((data) => {
        setTickets(data);
        // khởi tạo quantity = 0 cho từng loại vé
        const initQuantities = data.reduce((acc, t) => {
          acc[t.type] = 0;
          return acc;
        }, {});
        setQuantities(initQuantities);
      })
      .catch((err) => console.error("Lỗi khi tải vé:", err));
  }, [event]);

  if (!event) return <p>Không có dữ liệu sự kiện.</p>;

  const handleQuantityChange = (type, value) => {
    setQuantities((prev) => ({
      ...prev,
      [type]: Math.max(0, prev[type] + value),
    }));
  };

  // 🔹 Tính tổng tiền
  const total = tickets.reduce((sum, t) => sum + (quantities[t.type] * t.price), 0);

  const handlePayment = () => {
    const selectedTickets = tickets
      .map((t) => ({
        type: t.type,
        price: t.price,
        quantity: quantities[t.type] || 0,
      }))
      .filter((t) => t.quantity > 0);

    localStorage.setItem("tickets", JSON.stringify(selectedTickets));
    localStorage.setItem("eventTitle", event.title);
    navigate("/payment");
  };

  return (
    <div style={{ display: "flex", padding: "20px", backgroundColor: "#111", color: "white" }}>
      {/* Danh sách vé bên trái */}
      <div style={{ flex: 2, padding: "20px" }}>
        <h2>Chọn vé</h2>
        {tickets.length === 0 ? (
          <p>Đang tải vé...</p>
        ) : (
          tickets.map((ticket, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 0",
                borderBottom: "1px solid #333",
              }}
            >
              <div>
                <b>{ticket.type}</b>
                <p>{ticket.price.toLocaleString()} VND</p>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <button
                  onClick={() => handleQuantityChange(ticket.type, -1)}
                  style={{
                    background: "black",
                    color: "white",
                    padding: "5px 10px",
                    border: "1px solid #444",
                    cursor: "pointer",
                  }}
                >
                  -
                </button>
                <span style={{ margin: "0 10px" }}>{quantities[ticket.type]}</span>
                <button
                  onClick={() => handleQuantityChange(ticket.type, 1)}
                  style={{
                    background: "black",
                    color: "white",
                    padding: "5px 10px",
                    border: "1px solid #444",
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Thông tin sự kiện bên phải */}
      <div
        style={{
          flex: 1,
          padding: "20px",
          backgroundColor: "#222",
          borderRadius: "10px",
          marginLeft: "20px",
        }}
      >
        <h3>{event.title}</h3>
        <img
          src={event.image}
          alt="event"
          style={{ width: "100%", borderRadius: "10px", marginBottom: "10px" }}
        />
        <p>{event.description}</p>

        <h4>Giá vé:</h4>
        <ul>
          {tickets.map((t, i) => (
            <li key={i}>
              {t.type}: {t.price.toLocaleString()} VND
            </li>
          ))}
        </ul>

        <h3>Tổng: {total.toLocaleString()} VND</h3>

        <button
          onClick={handlePayment}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: "5px",
            fontSize: "16px",
            width: "100%",
          }}
        >
          Thanh toán
        </button>
      </div>
    </div>
  );
}

export default SelectTicket;
