import React, { useState, useEffect } from "react";
import Banner from "./Banner";
import EventSection from "./EventSection";
import { getEvents } from "../../api/eventApi";
import { getRankedEvents } from "../../api/promotionApi";
import "../css/Banner.css";
import "../css/EventSection.css";

function HomePage({ searchTerm }) {
  const [bannerIndex1, setBannerIndex1] = useState(0);
  const [bannerIndex2, setBannerIndex2] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [topEvents, setTopEvents] = useState([]);
  const [featuredEvents, setFeaturedEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [activeTimeTab, setActiveTimeTab] = useState("Cuối tuần này");

  // Lấy user đăng nhập
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  // FETCH EVENTS & RANKED PROMOTIONS
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const [eventsData, rankedRes] = await Promise.all([
          getEvents().catch(() => []),
          getRankedEvents().catch(() => null),
        ]);

        const allEv = eventsData || [];
        setEvents(allEv);
        setFilteredEvents(allEv);

        if (rankedRes?.success && rankedRes.data) {
          setTopEvents(rankedRes.data.topEvents || []);
          setFeaturedEvents(rankedRes.data.featuredEvents || []);
          setRecommendedEvents(rankedRes.data.recommendedEvents || []);
        }
      } catch (err) {
        console.error("Lỗi khi fetch events:", err);
      }
    };
    loadEvents();
  }, []);

  // Khôi phục favorites
  useEffect(() => {
    if (!userId) return;
    const storedFavs =
      JSON.parse(localStorage.getItem(`favorites_${userId}`)) || [];
    setFavorites(storedFavs);
  }, [userId]);

  // Điều khiển auto 2 Banner
  useEffect(() => {
    const interval1 = setInterval(() => {
      setBannerIndex1((prev) =>
        events.length > 0 ? (prev + 1) % events.length : 0
      );
    }, 5000);

    const interval2 = setInterval(() => {
      setBannerIndex2((prev) =>
        events.length > 0 ? (prev + 1) % events.length : 0
      );
    }, 6000);

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [events.length]);

  const nextBanner1 = () => setBannerIndex1((prev) => (prev + 1) % (events.length || 1));
  const prevBanner1 = () =>
    setBannerIndex1((prev) => (prev === 0 ? (events.length ? events.length - 1 : 0) : prev - 1));
  const selectBanner1 = (index) => setBannerIndex1(index);

  const nextBanner2 = () => setBannerIndex2((prev) => (prev + 1) % (events.length || 1));
  const prevBanner2 = () =>
    setBannerIndex2((prev) => (prev === 0 ? (events.length ? events.length - 1 : 0) : prev - 1));
  const selectBanner2 = (index) => setBannerIndex2(index);

  // Toggle Favorite
  const toggleFavorite = (event) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f._id === event._id);
      let updated;
      if (exists) {
        updated = prev.filter((f) => f._id !== event._id);
      } else {
        updated = [...prev, event];
      }

      if (userId) {
        localStorage.setItem(`favorites_${userId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Search Filter
  useEffect(() => {
    let result = [...events];
    if (searchTerm) {
      result = result.filter(
        (e) =>
          e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredEvents(result);
  }, [events, searchTerm]);

  const activeEvents = events.filter((ev) => ev.status === "active");

  // Helper lấy sự kiện theo Category
  const getCategoryEvents = (catId) => {
    return activeEvents.filter((ev) => {
      if (typeof ev.categoryId === "string") return ev.categoryId === catId;
      if (typeof ev.categoryId === "object" && ev.categoryId) return ev.categoryId._id === catId;
      return false;
    });
  };

  const musicEvents = getCategoryEvents("cat_music");
  const workshopEvents = getCategoryEvents("cat_workshop");
  const sportEvents = getCategoryEvents("cat_sport");
  const favEvents = activeEvents.filter((ev) =>
    favorites.some((fav) => fav._id === ev._id)
  );

  // Lọc theo Tab "Cuối tuần này" / "Tháng này"
  const timeFilteredEvents = activeEvents.filter((ev) => {
    if (!ev.date) return true;
    const evDate = new Date(ev.date);
    const now = new Date();
    if (activeTimeTab === "Cuối tuần này") {
      // Sự kiện trong vòng 14 ngày tới
      const diffDays = (evDate - now) / (1000 * 3600 * 24);
      return diffDays >= -1 && diffDays <= 14;
    } else {
      // Sự kiện trong tháng
      return evDate.getMonth() === now.getMonth() || evDate >= now;
    }
  });

  return (
    <div className="homepage-wrapper" style={{ backgroundColor: "#0b0d13", minHeight: "100vh" }}>
      {/* 🖼️ 2 BANNER SONG SONG */}
      <div className="banner-container">
        <Banner
          bannerIndex={bannerIndex1}
          nextBanner={nextBanner1}
          prevBanner={prevBanner1}
          selectBanner={selectBanner1}
        />
        <Banner
          bannerIndex={bannerIndex2}
          nextBanner={nextBanner2}
          prevBanner={prevBanner2}
          selectBanner={selectBanner2}
        />
      </div>

      {/* 🔍 NẾU CÓ SEARCH TỪ HEADER */}
      {searchTerm && (
        <EventSection
          title={`Kết quả tìm kiếm cho "${searchTerm}"`}
          events={filteredEvents}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          variant="standard"
        />
      )}

      {/* 👑 TOP EVENTS (Sự kiện có gói TOP promotion) */}
      {topEvents.length > 0 && (
        <EventSection
          title="Top Sự Kiện Hàng Đầu"
          icon="👑"
          events={topEvents}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          variant="trending"
        />
      )}

      {/* ⭐ FEATURED EVENTS (Sự kiện có gói FEATURED promotion) */}
      <EventSection
        title="Sự kiện nổi bật (Featured Events)"
        icon="⭐"
        events={featuredEvents.length > 0 ? featuredEvents : (activeEvents.length > 0 ? activeEvents : events)}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        variant="portrait"
      />

      {/* ✨ RECOMMENDED EVENTS (Rule-based recommendation + gói RECOMMENDED) */}
      <EventSection
        title="Gợi ý dành cho bạn (Recommended Events)"
        icon="✨"
        events={recommendedEvents.length > 0 ? recommendedEvents : (activeEvents.length > 0 ? activeEvents : events)}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        variant="standard"
      />

      {/* 🔥 KHỐI 2: SỰ KIỆN XU HƯỚNG (Trending With Numbers 1, 2, 3, 4) */}
      <EventSection
        title="Sự kiện xu hướng"
        icon="🔥"
        events={activeEvents.length > 0 ? activeEvents : events}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        variant="trending"
      />

      {/* 📅 KHỐI 3: CUỐI TUẦN NÀY / THÁNG NÀY (Tab navigation + 16:9 Grid) */}
      <EventSection
        tabs={["Cuối tuần này", "Tháng này"]}
        activeTab={activeTimeTab}
        onTabChange={setActiveTimeTab}
        events={timeFilteredEvents.length > 0 ? timeFilteredEvents : activeEvents}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        variant="standard"
        seeMoreLink="/search"
      />

      {/* 🎟️ DẢI BANNER QUẢNG CÁO 1 (Resale Ticket - Vé bán lại an toàn) */}
      <div className="promo-banner-strip">
        <div className="promo-banner-card">
          <div className="promo-content">
            <h3>TicketNow <span>Resale</span> • Sang nhượng vé an toàn</h3>
            <p>Mua bán lại vé chính hãng 100%, bảo chứng thanh toán qua PayOS và kiểm duyệt tự động.</p>
          </div>
          <a href="/search" className="promo-btn">
            Khám phá vé bán lại
          </a>
        </div>
      </div>

      {/* 🎵 KHỐI 4: NHẠC SỐNG */}
      <EventSection
        title="Nhạc sống"
        events={musicEvents.length > 0 ? musicEvents : activeEvents.slice(0, 4)}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        variant="standard"
        seeMoreLink="/category/cat_music"
      />

      {/* 💳 DẢI BANNER QUẢNG CÁO 2 (Ưu đãi mở thẻ / Giảm giá) */}
      <div className="promo-banner-strip">
        <div className="promo-banner-card" style={{ background: "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" }}>
          <div className="promo-content">
            <h3>Ưu đãi đặt vé sớm • <span>Giảm đến 20%</span></h3>
            <p>Nhập mã TICKETNOW2026 khi thanh toán qua cổng PayOS để nhận ngay chiết khấu đặc biệt.</p>
          </div>
          <a href="/search" className="promo-btn">
            Săn vé ngay
          </a>
        </div>
      </div>

      {/* 🎭 KHỐI 5: SÂN KHẤU & WORKSHOP */}
      <EventSection
        title="Sân khấu & Nghệ thuật"
        events={workshopEvents.length > 0 ? workshopEvents : activeEvents.slice(1, 5)}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        variant="standard"
        seeMoreLink="/category/cat_workshop"
      />

      {/* ⚽ KHỐI 6: THỂ THAO & HỘI CHỢ (Nếu có) */}
      {sportEvents.length > 0 && (
        <EventSection
          title="Thể thao & Hoạt động ngoài trời"
          events={sportEvents}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          variant="standard"
          seeMoreLink="/category/cat_sport"
        />
      )}

      {/* ❤️ KHỐI 7: DÀNH CHO BẠN (Sự kiện yêu thích) */}
      {favEvents.length > 0 && (
        <EventSection
          title="Dành cho bạn (Yêu thích)"
          events={favEvents}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
          variant="standard"
          seeMoreLink="/favorites"
        />
      )}
    </div>
  );
}

export default HomePage;