import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../user/css/Favourites.css";

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
    const [userId, setUserId] = useState(null); // 🟩 THÊM DÒNG NÀY: lưu id user hiện tại
  const navigate = useNavigate();

  // ✅ Lấy danh sách sự kiện yêu thích từ localStorage
  // ✅ Lấy danh sách sự kiện yêu thích từ localStorage khi load trang
  
  // 🟩 BƯỚC 1: Lấy userId từ localStorage (nếu có đăng nhập)
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser._id) {
      setUserId(storedUser._id);
    }
  }, []);

  // 🟩 BƯỚC 2: Lấy danh sách yêu thích theo từng user (thay vì chung "favorites")
  useEffect(() => {
    if (userId) {
      const storedFavorites =
        JSON.parse(localStorage.getItem(`favorites_${userId}`)) || [];
      setFavorites(storedFavorites);
    }
  }, [userId]);

  // 🟩 BƯỚC 3: Sửa lại toggleFavorite để lưu theo user riêng biệt
  const toggleFavorite = (event) => {
    if (!userId) {
      alert("Vui lòng đăng nhập để sử dụng tính năng yêu thích 💖");
      return;
    }

    let updatedFavorites;
    if (favorites.some((f) => f._id === event._id)) {
      // Nếu đã có → bỏ thích
      updatedFavorites = favorites.filter((f) => f._id !== event._id);
    } else {
      // Nếu chưa có → thêm
      updatedFavorites = [...favorites, event];
    }

    setFavorites(updatedFavorites);
    localStorage.setItem(`favorites_${userId}`, JSON.stringify(updatedFavorites)); // 🟩 SỬA Ở ĐÂY
  };

  // 🟩 BƯỚC 4: Hiển thị thông báo nếu chưa đăng nhập
  if (!userId) {
    return (
      <div style={{
        textAlign: "center",
        minHeight: "100vh",
        background: "#0b0d13",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: "1.1rem",
      }}>
        Bạn cần đăng nhập để xem sự kiện yêu thích 💌
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        minHeight: "100vh",
        background: "#0b0d13",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#64748b",
        fontSize: "1.1rem",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: 16, opacity: 0.5 }}>💚</div>
        Bạn chưa yêu thích sự kiện nào
      </div>
    );
  }

  return (
    <div className="favorites-section">
      <div className="section-header">
        <h2 style={{ paddingLeft: "16px" }}>💚 Sự kiện yêu thích</h2>
      </div>

      {/* Lưới hiển thị card */}
      <div className="scroll-row">
        {favorites.map((event) => (
          <div className="suggest-card" key={event._id}>
            {/* Ảnh banner */}
            <img
              src={event.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
              alt={event.title}
            />

            <h4>{event.title}</h4>

            <p style={{ color: "#00E599", fontWeight: 600, fontSize: "0.82rem", textTransform: "uppercase" }}>
              {event.categoryName || event.categoryId}
            </p>

            {/* Nút tim ở góc phải trên */}
            <button
              className={`fav-btn ${favorites.some(f => f._id === event._id) ? "active" : ""}`}
              onClick={() => toggleFavorite(event)}
            >
              {favorites.some(f => f._id === event._id) ? "❤️" : "🤍"}
            </button>

            <p className="text-gray-500">
              📅 {new Date(event.date).toLocaleDateString("vi-VN")}
            </p>
            <p className="text-gray-500">
              🏷 {event.categoryId || "Không có danh mục"}
            </p>

            {/* Nút xem chi tiết */}
            <button
              onClick={() => navigate(`/event/${event._id}`)}
              className="btn btn-info"
            >
              🔍 Xem chi tiết
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FavoritesPage;
