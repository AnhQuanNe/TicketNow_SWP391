import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Review from "./Review";
import Swal from "sweetalert2";
import { getEventById } from "../../api/eventApi";
import { checkEventAccess } from "../../api/membershipApi";
import "../../user/css/EventDetail.css";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [accessInfo, setAccessInfo] = useState(null);

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const data = await getEventById(id);

        setEvent({
          ...data,
          imageURL:
            data.imageUrl ||
            "https://via.placeholder.com/900x400?text=No+Image",
        });

        // Kiểm tra quyền mua vé theo membership
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const acc = await checkEventAccess(id, token);
            setAccessInfo(acc);
          } catch (e) {
            console.warn("Không thể check event access:", e.message);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadEvent();
  }, [id]);

  if (!event)
    return (
      <div style={{ textAlign: "center", color: "#00E599", marginTop: 50, background: "#0b0d13", minHeight: "100vh", paddingTop: 100 }}>
        ⏳ Đang tải sự kiện...
      </div>
    );

  const handleBuyTicket = async () => {
    const loggedIn = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!loggedIn || !token) {
      Swal.fire({
        icon: "warning",
        title: "Bạn chưa đăng nhập",
        text: "Vui lòng đăng nhập để mua vé!",
        confirmButtonText: "OK",
        background: "#141824",
        color: "#e2e8f0",
        confirmButtonColor: "#00E599",
      });
      return;
    }

    // Backend verification
    try {
      const acc = await checkEventAccess(event._id, token);
      if (acc && !acc.allowed) {
        Swal.fire({
          icon: "warning",
          title: "Không thể mua vé lúc này",
          text: acc.message || "Bạn chưa đủ điều kiện để mua vé sự kiện này.",
          background: "#141824",
          color: "#e2e8f0",
          confirmButtonColor: "#00E599",
          showCancelButton: true,
          confirmButtonText: "Xem gói Hội viên",
          cancelButtonText: "Đóng",
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/membership");
          }
        });
        return;
      }
    } catch (err) {
      console.warn("Lỗi kiểm tra quyền:", err);
    }

    navigate(`/select-ticket/${event._id}`);
  };

  const isExpired = new Date(event.date) < new Date();
  const isSoldOut = (event.ticketsAvailable || 0) <= 0;
  const canBuy = !isExpired && !isSoldOut;
  const dynamicLabel = isSoldOut
    ? "🚫 Hết vé"
    : isExpired
      ? "⏰ Đã kết thúc"
      : "🎫 Mua vé ngay";

  return (
    <div className="ed-page">
      {/* Banner */}
      <div className="ed-banner">
        <img
          src={event.imageURL || "https://via.placeholder.com/900x400?text=No+Image"}
          alt={event.title}
          className="ed-banner-img"
        />
        <div className="ed-banner-overlay">
          {/* Member-Only Badge */}
          {event.membershipRequired === "VIP" && (
            <div className="ed-member-badge vip">
              👑 VIP Only
            </div>
          )}
          {event.membershipRequired === "PREMIUM" && (
            <div className="ed-member-badge premium">
              ⭐ Member Only
            </div>
          )}

          <h1 className="ed-title">{event.title}</h1>
          <p className="ed-subtitle">
            <span className="ed-accent">📅</span>
            {new Date(event.date).toLocaleDateString("vi-VN")} -{" "}
            {new Date(event.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            <span style={{ margin: "0 8px", opacity: 0.4 }}>|</span>
            <span className="ed-accent">📍</span>
            {event.locationId}
          </p>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div className="ed-content">
        <div className="ed-description">
          <h2 className="ed-desc-title">Giới thiệu sự kiện</h2>
          <p style={{ whiteSpace: "pre-line" }}>
            {event.description.replace(/\*\*/g, "")}
          </p>
        </div>

        <div className="ed-info">
          {/* Early Access Alert Card */}
          {event.saleStartTime && new Date() < new Date(event.saleStartTime) && (
            <div
              className={`ed-early-access-card ${
                accessInfo?.allowed ? "" : "warning"
              }`}
            >
              <p className="ed-ea-title">
                <span>⏱️</span>
                {accessInfo?.allowed
                  ? "Đang mở bán sớm (Early Access)"
                  : "Chưa mở bán công khai"}
              </p>
              <p className="ed-ea-desc">
                {accessInfo?.message ||
                  `Mở bán công khai: ${new Date(event.saleStartTime).toLocaleString("vi-VN")}. Hội viên VIP được mua trước 30 phút, Premium trước 15 phút.`}
              </p>
              {!accessInfo?.allowed && (
                <span
                  className="ed-upgrade-link"
                  onClick={() => navigate("/membership")}
                >
                  ⚡ Nâng cấp hội viên để mua ngay
                </span>
              )}
            </div>
          )}

          <p className="ed-info-text">
            <span className="info-icon">🎟️</span>
            <b>Vé còn lại:</b>
            <span style={{ color: "#00E599", fontWeight: 700 }}>{event.ticketsAvailable}</span>
          </p>
          <p className="ed-info-text">
            <span className="info-icon">📍</span>
            <b>Địa điểm:</b> {event.locationId}
          </p>
          <p className="ed-info-text">
            <span className="info-icon">🕐</span>
            <b>Thời gian:</b> {new Date(event.date).toLocaleString("vi-VN")}
          </p>

          <button
            className="ed-btn"
            disabled={!canBuy}
            onClick={canBuy ? handleBuyTicket : undefined}
            title={
              isSoldOut
                ? "Sự kiện đã hết vé"
                : isExpired
                  ? "Sự kiện đã kết thúc"
                  : "Mua vé cho sự kiện này"
            }
          >
            {dynamicLabel}
          </button>
        </div>
      </div>

      {/* ⭐ Reviews full-width panel below */}
      <div className="ed-review-panel">
        <Review
          eventId={event._id}
          token={localStorage.getItem("token")}
          currentUser={JSON.parse(localStorage.getItem("user") || "null")}
        />
      </div>
    </div>
  );
}

export default EventDetail;