import React, { useState, useEffect } from "react";
import "../../App.css";
import "../css/Banner.css";
import { getEvents } from "../../api/eventApi";
import { getActiveBanners } from "../../api/promotionApi";

function Banner({ bannerIndex, nextBanner, prevBanner, selectBanner }) {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        // 1. Thử lấy banner promotion đang active
        const promoRes = await getActiveBanners().catch(() => null);
        if (promoRes?.success && promoRes.data && promoRes.data.length > 0) {
          // Format banner promotion
          const promoBanners = promoRes.data.map((p) => ({
            id: p.eventId?._id || p._id,
            eventId: p.eventId?._id,
            title: p.bannerTitle || p.eventId?.title || "Sự kiện nổi bật",
            imageUrl: p.customBannerUrl || p.eventId?.imageUrl,
            isSponsored: true,
          }));
          setBanners(promoBanners);
          return;
        }

        // 2. Fallback sang events thông thường nếu chưa có banner quảng cáo
        const events = await getEvents();
        if (events && events.length > 0) {
          const fallback = events.map((ev) => ({
            id: ev._id,
            eventId: ev._id,
            title: ev.title,
            imageUrl: ev.imageUrl,
            isSponsored: false,
          }));
          setBanners(fallback);
        }
      } catch (err) {
        console.error("Lỗi fetch banner:", err);
      }
    };

    loadBanners();
  }, []);

  if (banners.length === 0) {
    return <div className="no-banner">Đang tải sự kiện...</div>;
  }

  const currentBanner = banners[bannerIndex % banners.length];

  return (
    <div className="banner">
      {/* Nút điều hướng */}
      <button className="banner-btn prev" onClick={prevBanner}>
        &lt;
      </button>

      {/* Ảnh banner */}
      <img
        src={currentBanner.imageUrl}
        alt={currentBanner.title}
        className="banner-img"
      />

      {/* Sponsored Badge nếu là banner promotion */}
      {currentBanner.isSponsored && (
        <div
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "linear-gradient(135deg, #00E599 0%, #00B4D8 100%)",
            color: "#080a0f",
            fontWeight: "800",
            fontSize: "0.75rem",
            padding: "4px 10px",
            borderRadius: "6px",
            zIndex: 10,
            boxShadow: "0 4px 12px rgba(0, 229, 153, 0.4)",
          }}
        >
          TIÊU ĐIỂM
        </div>
      )}

      {/* Overlay chữ */}
      <div className="banner-overlay">
        <span
          style={{
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: "700",
            marginBottom: "8px",
            maxWidth: "70%",
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {currentBanner.title}
        </span>
        <a href={`/event/${currentBanner.eventId}`} className="banner-link">
          Xem chi tiết
        </a>
      </div>

      {/* Nút điều hướng */}
      <button className="banner-btn next" onClick={nextBanner}>
        &gt;
      </button>

      {/* Dấu chấm chỉ vị trí */}
      <div className="banner-dots">
        {banners.map((_, idx) => (
          <span
            key={idx}
            className={`dot ${idx === bannerIndex % banners.length ? "active" : ""}`}
            onClick={() => selectBanner(idx)}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default Banner;