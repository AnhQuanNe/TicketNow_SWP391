// src/user/js/CategoryPage.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import EventSection from "./EventSection";
import { API_BASE_URL } from "../../config";

/*
  ✅ FIX SUMMARY:
  - Hỗ trợ cả params ':categorySlug' và ':id' (nhiều dự án route khác nhau).
  - Kiểm tra categoryInfo trước khi dùng .name để tránh crash.
  - Chỉ fetch events khi có categoryInfo.id.
  - Comment rõ ràng chỗ cần chú ý.
*/

function CategoryPage() {
  // 🟨 useParams có thể trả về { categorySlug } nếu route '/category/:categorySlug'
  //    hoặc { id } nếu route '/category/:id'. Mình lấy cả hai để an toàn.
  const params = useParams(); // { categorySlug?: "...", id?: "..." }
  const categorySlugFromParams = params.categorySlug;
  const idFromParams = params.id;

  // 🟨 Nếu bạn dùng direct route '/music' (không có /category/), thì useParams() sẽ trả {}.
  //      Trong trường hợp đó bạn có thể thay đổi App.js để dùng '/category/:id' hoặc
  //      thêm route '/music' -> mình có xử lý fallback bên dưới (xem phần map).
  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // ánh xạ slug -> categoryId trong MongoDB
  const categoryMap = {
    music: { id: "cat_music", name: "Âm nhạc" },
    workshop: { id: "cat_workshop", name: "Workshop / Kỹ năng" },
    sport: { id: "cat_sport", name: "Thể thao" },
    market: { id: "cat_market", name: "Hội chợ" },

    // 🟨 TÙY CHỌN: nếu bạn có routes dạng '/category/12345' (id thực trong DB),
    //           có thể map thêm ở đây (hoặc fetch category từ API).
    // "12345": { id: "12345", name: "Tên từ DB" },
  };

  // 🟨 CHÍNH SỬA: hỗ trợ lấy giá trị từ param 'categorySlug' hoặc 'id'
  // nếu có idFromParams nhưng idFromParams = 'music' thì vẫn OK.
  const incomingKey = categorySlugFromParams || idFromParams;
  const categoryInfo = incomingKey ? categoryMap[incomingKey] : undefined;

  // 👇 Dùng user từ localStorage (giữ nguyên logic của bạn)
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  // 🔹 FETCH sự kiện — CHỈ chạy khi categoryInfo tồn tại
  useEffect(() => {
    // 🟨 Nếu không có categoryInfo (ví dụ param sai hoặc url là '/music' nhưng bạn chưa map),
    //      không fetch để tránh crash; hiển thị thông báo thay vào đó.
    if (!categoryInfo || !categoryInfo.id) {
      setEvents([]); // reset
      return;
    }

    // 🔧 Bạn có thể tối ưu bằng endpoint filter phía backend nếu có:
    // fetch(`${API_BASE_URL}/api/events?categoryId=${categoryInfo.id}`)
    fetch(`${API_BASE_URL}/api/events`)
      .then((res) => res.json())
      .then((data) => {
        // 🟨 Cẩn trọng: một số event.categoryId có thể là object hoặc string -> robust check
        const filtered = data.filter((ev) => {
          // nếu categoryId là object { _id: 'cat_music' } hoặc là string 'cat_music'
          if (!ev.categoryId) return false;
          if (typeof ev.categoryId === "string") {
            return ev.categoryId === categoryInfo.id;
          } else if (typeof ev.categoryId === "object") {
            // thử kiểm tra _id hoặc id
            return (
              ev.categoryId._id === categoryInfo.id ||
              ev.categoryId.id === categoryInfo.id ||
              ev.categoryId === categoryInfo.id
            );
          }
          return false;
        });
        setEvents(filtered);
      })
      .catch((err) => {
        console.error("Lỗi khi fetch events:", err);
        setEvents([]); // đảm bảo không undefined
      });
  }, [categoryInfo]); // 🟨 phụ thuộc vào categoryInfo

  // 🔹 Lấy favorites từ localStorage theo user
  useEffect(() => {
    if (!userId) return;
    const storedFavs =
      JSON.parse(localStorage.getItem(`favorites_${userId}`)) || [];
    setFavorites(storedFavs);
  }, [userId]);

  // ❤️ Toggle yêu thích (giữ như bạn đang dùng)
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

  // 🟨 BẢO VỆ RENDER: nếu categoryInfo không tồn tại → thông báo rõ ràng
  if (!incomingKey) {
    // không có param ở URL (ví dụ bạn dùng /music without route) -> hướng dẫn sửa route
    return (
      <div className="container mx-auto py-8">
        <p>Không tìm thấy danh mục. URL thiếu tham số phân loại.</p>
        <p>
          Hãy chuyển đến đường dẫn dạng <code>/category/music</code> hoặc update{" "}
          <code>App.js</code> để thêm route <code>/music</code>.
        </p>
      </div>
    );
  }

  if (!categoryInfo) {
    // param có nhưng không có trong categoryMap
    return (
      <div className="container mx-auto py-8">
        <p>
          Danh mục "<strong>{incomingKey}</strong>" không hợp lệ hoặc chưa được
          cấu hình trong <code>categoryMap</code>.
        </p>
        <p>
          Mở <code>src/user/js/CategoryPage.js</code> và thêm mapping cho key này
          (ví dụ: <code>music: &#123; id: "cat_music", name: "Âm nhạc" &#125;</code>).
        </p>
      </div>
    );
  }

  // ✅ Nếu mọi thứ OK thì render danh sách
  return (
    <div className="container mx-auto py-8">
      {/* 🟨 an toàn: categoryInfo đã tồn tại, có thể dùng .name */}
      <h2 className="text-2xl font-bold mb-6">{categoryInfo.name}</h2>

      {events.length > 0 ? (
        <EventSection
          title=""
          events={events}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      ) : (
        <p>Không có sự kiện {categoryInfo.name.toLowerCase()} nào.</p>
      )}
    </div>
  );
}

export default CategoryPage;
