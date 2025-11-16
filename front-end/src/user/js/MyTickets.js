import React, { useEffect, useState } from "react";
import "../../user/css/MyTicket.css";

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

    fetch(`http://localhost:5000/api/bookings/${user._id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.bookings)) setTickets(data.bookings);
        else setTickets([]);
      })
      .catch(() => setError("Không thể tải vé."))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="flex items-center justify-center h-screen text-gray-500">Đang tải vé...</div>;

  if (error)
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>;

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
    <div
      className="min-h-screen flex flex-col items-center py-12 px-4"
      style={{ backgroundColor: "#f8f8f8", color: "#222" }}
    >
      <h1 className="text-3xl font-bold mb-10">Vé của tôi</h1>

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
        {filteredTickets.map((t) => {
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
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedQR(t)}   // 🔥 CLICK CARD → SHOW QR
            >
              <h3 className="text-lg font-semibold mb-2">{t.eventId?.title}</h3>
              <p className="text-sm">📍 {t.eventId?.locationId || "Chưa có địa điểm"}</p>
              <p className="text-sm">
                📅 {t.eventId?.date ? new Date(t.eventId.date).toLocaleDateString("vi-VN") : "Chưa có"}
              </p>

              <p className="text-sm" style={{ color: "#ff7b00" }}>
                💰 {t.totalPrice?.toLocaleString()} VNĐ
              </p>

              <p className="text-sm mb-1">
                🎫 Loại vé: <b>{t.ticketType}</b>
              </p>

              <p className="text-xs text-gray-600 mb-3">
                🕒 Mua lúc: {new Date(t.createdAt).toLocaleString("vi-VN")}
              </p>

              <span className={`status-tag ${statusClass}`}>{viStatus}</span>
            </div>
          );
        })}
      </div>

      {/* 🔥 QR POPUP */}
      {selectedQR && (
        <div className="qr-overlay" onClick={() => setSelectedQR(null)}>
          <div className="qr-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-3">{selectedQR.eventId?.title}</h2>

            <img
              src={selectedQR.qrCode}
              alt="QR"
              style={{ width: "250px", margin: "0 auto", borderRadius: "12px" }}
            />

            <p className="text-center mt-3 text-gray-500 text-sm">
              Vé loại: {selectedQR.ticketType}
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
