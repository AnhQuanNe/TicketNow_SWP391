import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
      <div className="text-center mt-20 text-gray-600 text-xl">
        Bạn cần đăng nhập để xem sự kiện yêu thích 💌
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center mt-20 text-gray-600 text-xl">
        Bạn chưa tim sự kiện nào 💔
      </div>
    );
  }

  return (
    <div className="px-6 py-10">
      <h2 className="text-3xl font-bold mb-8 text-center text-pink-600">
        💖 Sự kiện của tôi
      </h2>

      {/* Lưới hiển thị card giống HomePage */}
      <div className="scroll-row">
        {favorites.map((event) => (
          <div className="suggest-card" key={event._id}>
            <div className="border rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden bg-white">
              {/* Ảnh banner */}
              <img
            src={event.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
            alt={event.title}
          />
          <h4>{event.title}</h4>
          <p>{event.categoryName || event.categoryId}</p>

              
            {/* Nút tim ở góc phải trên */}
          <button
            className={`fav-btn ${favorites.some(f => f._id === event._id) ? "active" : ""}`}
            onClick={() => toggleFavorite(event)}
          >
            {favorites.some(f => f._id === event._id) ? "❤️" : "🤍"}
          </button>

              {/* Nội dung sự kiện */}
              {/* <div className="p-4">
                <h3 className="text-lg font-semibold mb-1">{event.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                  {event.description}
                </p> */}

                <p className="text-gray-500 text-sm mb-1">
                  📅 {new Date(event.date).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-gray-500 text-sm mb-4">
                  🏷 {event.categoryId || "Không có danh mục"}
                </p>

                {/* Nút xem chi tiết */}
                <button
                  onClick={() => navigate(`/event/${event._id}`)}
                  className="btn btn-info my-2"
                >
                  🔍 View Detail
                </button>
              {/* </div> */}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default FavoritesPage;
