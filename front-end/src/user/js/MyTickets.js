import React, { useEffect, useState } from "react";
  import "../../user/css/MyTicket.css";  // Đảm bảo đúng đường dẫn

  export default function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("Tất cả");

    useEffect(() => {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user || !user._id) {
        setError("Không tìm thấy thông tin người dùng. Hãy đăng nhập lại.");
        setLoading(false);
        return;
      }

      const fetchTickets = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/bookings/${user._id}`);
          const data = await res.json();
          if (Array.isArray(data)) setTickets(data);
          else if (Array.isArray(data.bookings)) setTickets(data.bookings);
          else setTickets([]);
        } catch (err) {
          setError("Không thể tải vé. Vui lòng thử lại sau.");
        } finally {
          setLoading(false);
        }
      };

      fetchTickets();
    }, []);

    if (loading)
      return (
        <div className="flex items-center justify-center h-screen text-gray-500 text-lg">
          Đang tải vé...
        </div>
      );
    if (error)
      return (
        <div className="flex items-center justify-center h-screen text-red-500 text-lg">
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
            const viStatus = statusMap[t.status?.toLowerCase()] || "Khác";
            return viStatus === activeTab;
          });

    return (
      <div
        className="min-h-screen flex flex-col items-center py-12 px-4"
        style={{
          backgroundColor: "#f8f8f8",
          color: "#222",
          fontFamily: "Inter, sans-serif",
        }}
      >
        {/* --- Tiêu đề --- */}
        <h1
          className="text-3xl font-bold mb-10 tracking-wide"
          style={{ color: "#1a1a1a" }}
        >
          Vé của tôi
        </h1>

        {/* --- Tabs --- */}
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

        {/* --- Card Vé --- */}
        <div className="grid-container">
{filteredTickets.map((t) => {
            const viStatus = statusMap[t.status?.toLowerCase()] || "Chưa xác định";
            const statusClass =
              viStatus === "Thành công"
                ? "status-success"
                : viStatus === "Đang xử lý"
                ? "status-pending"
                : "status-cancelled";

            return (
              <div
                key={t._id || t.id}
                className="ticket-card"
                style={{
                  marginBottom: "20px", // Khoảng cách giữa các card
                }}
              >
                <h3
                  className="text-lg font-semibold mb-2 truncate"
                  style={{ color: "#222" }}
                >
                  {t.eventId?.title || "Không rõ sự kiện"}
                </h3>
                <p className="text-sm mb-1" style={{ color: "#555" }}>
                  📍 {t.eventId?.locationId?.name || "Chưa có địa điểm"}
                </p>
                <p className="text-sm mb-1" style={{ color: "#555" }}>
                  📅{" "}
                  {t.eventId?.date
                    ? new Date(t.eventId.date).toLocaleDateString("vi-VN")
                    : "Chưa có ngày"}
                </p>
                <p className="text-sm mb-3" style={{ color: "#ff7b00" }}>
                  💰 {t.totalPrice?.toLocaleString() ?? "Chưa có giá"} VNĐ
                </p>
                <p className="text-sm mb-2" style={{ color: "#444" }}>
  🎫 Loại vé: <b>{t.ticketType === "student" ? "Student" : "Guest"}</b>
</p>


                <span className={`status-tag ${statusClass}`}>
                  {viStatus}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
