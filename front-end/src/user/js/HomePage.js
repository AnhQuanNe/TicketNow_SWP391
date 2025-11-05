import React, { useState, useEffect } from "react";
import Banner from "./Banner";
import EventSection from "./EventSection";
//import Favourites from "./Favourites";
import EventFilterBar from "./EventFilterBar";
import { API_BASE_URL } from "../../config";
import "../css/Banner.css"

// 🏠 HOMEPAGE (2 BANNER, KHÔNG CATEGORY)
function HomePage({ searchTerm }) {
  const [bannerIndex1, setBannerIndex1] = useState(0);
  const [bannerIndex2, setBannerIndex2] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [sortOption, setSortOption] = useState("");

  // 🔧 THÊM ĐOẠN NÀY ĐỂ LẤY USER HIỆN TẠI
  const user = JSON.parse(localStorage.getItem("user")); // Lấy user đang đăng nhập
  const userId = user?._id; // Lấy id user (hoặc user.id tùy backend)

  // 🟢 FETCH EVENTS từ backend
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setFilteredEvents(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // 🟢 KHÔI PHỤC YÊU THÍCH từ localStorage khi load trang
  // 🔧 SỬA LẠI CHỖ KHÔI PHỤC YÊU THÍCH — mỗi user có key riêng
  useEffect(() => {
    if (!userId) return; // nếu chưa đăng nhập thì bỏ qua
    const storedFavs =
      JSON.parse(localStorage.getItem(`favorites_${userId}`)) || [];
    setFavorites(storedFavs);
  }, [userId]);

  // 🟢 2 Banner auto chuyển riêng biệt
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
    }, 6000); // banner 2 lệch nhịp nhẹ để không trùng

    return () => {
      clearInterval(interval1);
      clearInterval(interval2);
    };
  }, [events.length]);

  // 🟢 Điều khiển banner 1
  const nextBanner1 = () => setBannerIndex1((prev) => (prev + 1) % events.length);
  const prevBanner1 = () =>
    setBannerIndex1((prev) => (prev === 0 ? events.length - 1 : prev - 1));
  const selectBanner1 = (index) => setBannerIndex1(index);

  // 🟢 Điều khiển banner 2
  const nextBanner2 = () => setBannerIndex2((prev) => (prev + 1) % events.length);
  const prevBanner2 = () =>
    setBannerIndex2((prev) => (prev === 0 ? events.length - 1 : prev - 1));
  const selectBanner2 = (index) => setBannerIndex2(index);

  // ❤️🟢 CẬP NHẬT toggleFavorite để lưu & xoá yêu thích trong localStorage
  // 🔧 SỬA LẠI toggleFavorite ĐỂ LƯU THEO USER
  const toggleFavorite = (event) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f._id === event._id);
      let updated;
      if (exists) {
        updated = prev.filter((f) => f._id !== event._id); // nếu đã có → bỏ tim
      } else {
        updated = [...prev, event]; // nếu chưa có → thêm tim
      }

      // ✅ Lưu riêng theo user
      if (userId) {
        localStorage.setItem(`favorites_${userId}`, JSON.stringify(updated));
      }

      return updated;
    });
  };
  // 🟢 SORT + SEARCH
  const handleSortChange = (sort) => setSortOption(sort);

  useEffect(() => {
    let result = [...events];

    // Tìm kiếm theo tên hoặc mô tả
    if (searchTerm) {
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sắp xếp theo tùy chọn sort
    if (sortOption === "date_asc") {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortOption === "date_desc") {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortOption === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }

    setFilteredEvents(result);
  }, [events, searchTerm, sortOption]);

  // 🟠 SỬA: Đặt lại tên section theo _id trong MongoDB thay vì text tiếng Việt
  const sectionNames = [
    { id: "hot", name: "Thịnh hành" },
    { id: "cat_music", name: "Âm nhạc" },
    { id: "cat_workshop", name: "Workshop / Kỹ năng" },
    { id: "cat_sport", name: "Thể thao" },
    { id: "cat_market", name: "Hội chợ" },
    { id: "fav", name: "Dành cho bạn" },
  ];

  return (
    <>
      {/* 🖼 2 BANNER SONG SONG */}
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

      {/* 🎛 Thanh lọc & sắp xếp */}
      {/* 🔧 THAY ĐỔI: bỏ onCategoryChange vì nhóm bạn không dùng category nữa */}
      <EventFilterBar onSortChange={handleSortChange} sortOption={sortOption} />

      {/* 🔥 Các Section Sự kiện */}
      {sectionNames.map((sec) => {
        let filtered = [];

        if (sec.name === "Thịnh hành") {
          filtered = events;
        } else if (sec.name === "Dành cho bạn") {
          // ✅ Đổi lại cách lọc theo object yêu thích (favorites là array of objects)
          filtered = events.filter((ev) =>
            favorites.some((fav) => fav._id === ev._id)
          );
        } else {
          // ✅ FIX: categoryId trong MongoDB là string, không phải object
          filtered = events.filter(
            (ev) => ev.categoryId && ev.categoryId === sec.id
          );

        }

        return (
          <EventSection
            key={sec.id}
            title={sec.name}
            events={filtered}
            favorites={favorites}
            toggleFavorite={toggleFavorite}
          />
        );
      })}



      {/* 💖 Mục yêu thích */}
      {/* <Favourites
        eventsFromDB={events}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
      /> */}

      {/* 🔍 Kết quả tìm kiếm */}
      {searchTerm && (
        <EventSection
          title="Kết quả tìm kiếm"
          events={filteredEvents}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      )}
    </>
  );
}

export default HomePage;