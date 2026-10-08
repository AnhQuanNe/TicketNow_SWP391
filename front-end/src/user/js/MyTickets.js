import React, { useEffect, useState } from "react";
import "../../user/css/MyTicket.css";
import { API_BASE_URL } from "../../config.js";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("Tất cả");
  const [selectedQR, setSelectedQR] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user._id) {
      setError("Không tìm thấy thông tin người dùng.");
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/bookings/${user._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.bookings)) setTickets(data.bookings);
        else setTickets([]);
      })
      .catch(() => setError("Không thể tải vé."))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0b0d13", color: "#00E599" }}>
        ⏳ Đang tải vé...
      </div>
    );

  if (error)
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0b0d13", color: "#ef4444" }}>
        {error}
      </div>
    );

  const tabs = ["Tất cả", "Thành công", "Đang xử lý", "Đã hủy"];

  const statusMap = {
    confirmed: "Thành công",
    success: "Thành công",
    completed: "Thành công",
    paid: "Thành công",
    pending: "Đang xử lý",
    processing: "Đang xử lý",
    cancelled: "Đã hủy",
    canceled: "Đã hủy",
  };

  const filteredTickets =
    activeTab === "Tất cả"
      ? tickets
      : tickets.filter((t) => {
        const mapped = statusMap[t.status?.toLowerCase()] || "Khác";
        return mapped === activeTab;
      });

  return (
    <div className="my-tickets-page">
      <h1>🎟️ Vé của tôi</h1>

      {/* Tabs */}
      <div className="tab-container">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${activeTab === tab ? "active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="grid-container">
        {filteredTickets.length === 0 ? (
          <div className="empty-tickets">
            <div className="empty-icon">🎫</div>
            <p>Chưa có vé nào trong mục này.</p>
          </div>
        ) : (
          filteredTickets.map((t) => {
            const viStatus = statusMap[t.status?.toLowerCase()] || "Không xác định";
            const statusClass =
              viStatus === "Thành công"
                ? "status-success"
                : viStatus === "Đang xử lý"
                  ? "status-pending"
                  : "status-cancelled";

            return (
              <div
                key={t._id}
                className="ticket-card"
                onClick={() => setSelectedQR(t)}
              >
                <h3>{t.eventId?.title}</h3>
                <p>📍 {t.eventId?.locationId || "Chưa có địa điểm"}</p>
                <p>
                  📅 {t.eventId?.date ? new Date(t.eventId.date).toLocaleDateString("vi-VN") : "Chưa có"}
                </p>
                <p className="ticket-price">
                  💰 {t.totalPrice?.toLocaleString()} VNĐ
                </p>
                <p>
                  🎫 Loại vé: <b style={{ color: "#ffffff" }}>{t.ticketType}</b>
                </p>
                <p className="ticket-time">
                  🕒 Mua lúc: {new Date(t.createdAt).toLocaleString("vi-VN")}
                </p>
                <span className={`status-tag ${statusClass}`}>{viStatus}</span>
              </div>
            );
          })
        )}
      </div>

      {/* 🔥 QR POPUP */}
      {selectedQR && (
        <div className="qr-overlay" onClick={() => setSelectedQR(null)}>
          <div className="qr-box" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedQR.eventId?.title}</h2>

            <img
              src={selectedQR.qrCode}
              alt="QR"
              style={{ width: "220px", margin: "0 auto", display: "block" }}
            />

            <p className="qr-ticket-type">
              🎫 Vé loại: <b style={{ color: "#00E599" }}>{selectedQR.ticketType}</b>
            </p>

            <button className="close-btn" onClick={() => setSelectedQR(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
