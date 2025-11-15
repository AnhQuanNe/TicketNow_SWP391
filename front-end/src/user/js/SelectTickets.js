import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function SelectTicket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchEvent = fetch(`http://localhost:5000/api/events/${id}`)
      .then((res) => res.json())
      .then((data) => setEvent(data))
      .catch((err) => console.error(err));

    const fetchTickets = fetch(`http://localhost:5000/api/tickets/event/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTickets(data || []);
        const initial = {};
        (data || []).forEach((t) => (initial[t.ticketType] = 0));
        setQuantities(initial);
      })
      .catch((err) => console.error(err));

    Promise.all([fetchEvent, fetchTickets]).finally(() => setLoading(false));
  }, [id]);

  const handleQuantityChange = (ticketType, value) => {
    setQuantities((prev) => ({ ...prev, [ticketType]: Math.max(0, (prev[ticketType] || 0) + value) }));
  };

  const handlePayment = () => {
    const selectedTickets = tickets
      .map((t) => ({ticketType: t.ticketType, price: t.price, quantity: quantities[t.ticketType] || 0 }))
      .filter((t) => t.quantity > 0);

    if (selectedTickets.length === 0) {
      Swal.fire("⚠️", "Vui lòng chọn ít nhất 1 vé!", "warning");
      return;
    }

    const totalPrice = selectedTickets.reduce((acc, t) => acc + t.price * t.quantity, 0);
    const totalQuantity = selectedTickets.reduce((acc, t) => acc + t.quantity, 0);

    // 🔹 Lưu pendingTicket đầy đủ
    localStorage.setItem(
      "pendingTicket",
      JSON.stringify({
        userId: user._id,
        eventId: event._id,
        tickets: selectedTickets,
        quantity: totalQuantity,
        price: totalPrice,
      })
    );

    localStorage.setItem("eventTitle", event.title);
  localStorage.setItem("lastPaidEventId", event._id);
    // Save purchased event info for notifications
    try {
      const arr = JSON.parse(localStorage.getItem("purchasedEvents") || "[]");
      const exists = arr.some((e) => e._id === event._id);
      if (!exists) {
        arr.push({ _id: event._id, title: event.title, date: event.date });
        localStorage.setItem("purchasedEvents", JSON.stringify(arr));
      }
    } catch {}
    navigate("/payment");
  };

  if (loading) return <p>⏳ Đang tải dữ liệu...</p>;
  if (!event) return <p>❌ Không tìm thấy sự kiện.</p>;

  const total = tickets.reduce((sum, t) => sum + (quantities[t.ticketType] || 0) * t.price, 0);

  return (
     <div
      style={{
        backgroundColor: "#ffe6f2",
        minHeight: "100vh",
        padding: "60px 80px",
        color: "#333",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "flex",
          gap: "40px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* 🌸 Thông tin sự kiện */}
        <div
          style={{
            flex: 1.2,
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 0 15px rgba(255, 77, 166, 0.2)",
            overflow: "hidden",
            border: "1px solid #ffd6eb",
          }}
        >
          <img
            src={
              event.imageUrl ||
              "https://via.placeholder.com/600x350?text=No+Image"
            }
            alt={event.title}
            style={{ width: "100%", height: "340px", objectFit: "cover" }}
          />
          <div style={{ padding: "25px" }}>
            <h2 style={{ color: "#ff4da6", marginBottom: "10px" }}>
              {event.title}
            </h2>
            <p style={{ opacity: 0.9, marginBottom: "10px" }}>
              {event.description}
            </p>
            <p>
              <b>📍 Địa điểm:</b> {event.location || "Đang cập nhật"}
            </p>
            <p>
              <b>📅 Ngày diễn ra:</b>{" "}
              {event.date
                ? new Date(event.date).toLocaleDateString()
                : "Chưa có"}
            </p>
          </div>
        </div>

        {/* 🎟️ Khung chọn vé */}
        <div
          style={{
            flex: 0.9,
            background: "#fff",
            borderRadius: "16px",
            padding: "25px 30px",
            boxShadow: "0 0 15px rgba(255, 77, 166, 0.25)",
            border: "1px solid #ffd6eb",
          }}
        >
          <h3 style={{ color: "#ff4da6", marginBottom: "25px" }}>
            🎫 Chọn loại vé
          </h3>

          {tickets.length === 0 ? (
            <p>Không có loại vé nào cho sự kiện này.</p>
          ) : (
            tickets.map((ticket, index) => {
              const isStudentTicket =
                ticket.ticketType.toLowerCase() === "student" &&
                (!user || !user.studentId);

              return (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1px solid #f0cce0",
                    padding: "12px 0",
                    opacity: isStudentTicket ? 0.5 : 1,
                  }}
                >
                  <div>
                    <b style={{ fontSize: "17px", color: "#ff4da6" }}>
                      {ticket.ticketType}
                    </b>
                    <p style={{ color: "#777" }}>
                      {ticket?.price != null
                        ? ticket.price.toLocaleString()
                        : "—"}{" "}
                      VND
                    </p>
                    {isStudentTicket && (
                      <p style={{ color: "#ff4da6", fontSize: "13px" }}>
                        * Chỉ dành cho sinh viên
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={() => handleQuantityChange(ticket.ticketType, -1)}
                      style={btnStyle}
                      disabled={isStudentTicket}
                    >
                      −
                    </button>
                    <span
                      style={{
                        margin: "0 12px",
                        fontSize: "16px",
                        minWidth: "20px",
                        textAlign: "center",
                      }}
                    >
                      {quantities[ticket.ticketType] || 0}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(ticket.ticketType, 1)}
                      style={btnStyle}
                      disabled={isStudentTicket}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <h3 style={{ marginTop: "25px", color: "#ff4da6" }}>
            💰 Tổng: {total.toLocaleString()} VND
          </h3>

          <button
            onClick={handlePayment}
            style={payBtnStyle}
            onMouseOver={(e) =>
              (e.target.style.background =
                "linear-gradient(90deg, #ff99cc 0%, #ffb3d9 100%)")
            }
            onMouseOut={(e) =>
              (e.target.style.background =
                "linear-gradient(90deg, #ff80bf 0%, #ff4da6 100%)")
            }
          >
            Thanh toán ngay
          </button>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "#ffd6eb",
  color: "#ff4da6",
  padding: "6px 12px",
  border: "1px solid #ffb3d9",
  borderRadius: "6px",
  cursor: "pointer",
  transition: "0.2s",
  fontWeight: "bold",
};

const payBtnStyle = {
  marginTop: "25px",
  width: "100%",
  padding: "14px 20px",
  background: "linear-gradient(90deg, #ff80bf 0%, #ff4da6 100%)",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "18px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "0.3s",
  boxShadow: "0 4px 12px rgba(255, 77, 166, 0.3)",
};
export default SelectTicket;
