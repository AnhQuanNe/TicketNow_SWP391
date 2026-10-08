// src/user/js/CategoryPage.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import EventSection from "./EventSection";
import { getEvents } from "../../api/eventApi";

function CategoryPage() {
  const params = useParams();
  const categorySlugFromParams = params.categorySlug;
  const idFromParams = params.id;

  const directSlug = window.location.pathname.replace("/", "");

  const incomingKey =
    categorySlugFromParams || idFromParams || directSlug;

  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/categories`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDbCategories(data);
      })
      .catch((err) => console.error("Lỗi lấy categories từ server:", err));
  }, []);

  const defaultCategoryMap = {
    music: { id: "cat_music", name: "Âm nhạc" },
    cat_music: { id: "cat_music", name: "Âm nhạc" },
    workshop: { id: "cat_workshop", name: "Workshop / Kỹ năng" },
    cat_workshop: { id: "cat_workshop", name: "Workshop / Kỹ năng" },
    sport: { id: "cat_sport", name: "Thể thao" },
    cat_sport: { id: "cat_sport", name: "Thể thao" },
    market: { id: "cat_market", name: "Hội chợ" },
    cat_market: { id: "cat_market", name: "Hội chợ" },
    esport: { id: "cat_esports", name: "eSport" },
    esports: { id: "cat_esports", name: "eSport" },
    cat_esport: { id: "cat_esports", name: "eSport" },
    cat_esports: { id: "cat_esports", name: "eSport" },
  };

  // Tìm trong DB categories trước, sau đó fallback sang defaultCategoryMap
  const matchedDbCat = dbCategories.find(
    (c) =>
      c._id === incomingKey ||
      (c._id && c._id.replace("cat_", "").toLowerCase() === incomingKey?.replace("cat_", "").toLowerCase()) ||
      (c.name && c.name.toLowerCase() === incomingKey?.toLowerCase())
  );

  const categoryInfo = matchedDbCat
    ? { id: matchedDbCat._id, name: matchedDbCat.name }
    : defaultCategoryMap[incomingKey] || (
        incomingKey?.toLowerCase().includes("esport")
          ? { id: "cat_esports", name: "eSport" }
          : null
      );

  const [events, setEvents] = useState([]);
  const [favorites, setFavorites] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user?._id;

  useEffect(() => {
    if (!categoryInfo) {
      setEvents([]);
      return;
    }

    const loadEvents = async () => {
      try {
        const data = await getEvents();

        // 🔥 Lọc sự kiện chính xác theo categoryId
        const filtered = data.filter((ev) => {
          // ❗ Chặn event đã bị xóa
          if (ev.status !== "active") return false;

          if (!ev.categoryId) return false;

          const rawId = typeof ev.categoryId === "object" ? ev.categoryId._id : ev.categoryId;
          const rawName = typeof ev.categoryId === "object" ? (ev.categoryId.name || "") : (ev.categoryName || "");

          // Xử lý riêng cho trường hợp eSport / esports / cat_esports / cat_esport
          if (
            incomingKey === "esport" ||
            incomingKey === "esports" ||
            incomingKey === "cat_esport" ||
            incomingKey === "cat_esports" ||
            categoryInfo?.id === "cat_esports" ||
            categoryInfo?.id === "cat_esport"
          ) {
            return (
              rawId === "cat_esports" ||
              rawId === "cat_esport" ||
              rawId === "esport" ||
              rawId === "esports" ||
              rawName.toLowerCase().includes("esport")
            );
          }

          if (rawId === categoryInfo.id || rawId === incomingKey) {
            return true;
          }

          if (typeof ev.categoryId === "string") {
            return (
              ev.categoryId === categoryInfo.id ||
              ev.categoryId === incomingKey ||
              ev.categoryId.replace("cat_", "") === incomingKey.replace("cat_", "")
            );
          }

          if (typeof ev.categoryId === "object") {
            return (
              ev.categoryId._id === categoryInfo.id ||
              ev.categoryId._id === incomingKey ||
              ev.categoryId._id?.replace("cat_", "") === incomingKey.replace("cat_", "")
            );
          }

          return false;
        });

        setEvents(filtered);
      } catch (err) {
        console.error("Lỗi khi fetch events:", err);
        setEvents([]);
      }
    };

    loadEvents();
  }, [categoryInfo]);

  // favorites
  useEffect(() => {
    if (!userId) return;

    const storedFavs =
      JSON.parse(localStorage.getItem(`favorites_${userId}`)) || [];

    setFavorites(storedFavs);
  }, [userId]);

  const toggleFavorite = (event) => {
    setFavorites((prev) => {
      const exists = prev.find((f) => f._id === event._id);

      const updated = exists
        ? prev.filter((f) => f._id !== event._id)
        : [...prev, event];

      if (userId) {
        localStorage.setItem(
          `favorites_${userId}`,
          JSON.stringify(updated)
        );
      }

      return updated;
    });
  };

  if (!incomingKey || !categoryInfo) {
    return (
      <div className="container mx-auto py-8">
        <h2 className="text-xl font-bold">
          Danh mục không hợp lệ.
        </h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h2 className="text-2xl font-bold mb-6">
        {categoryInfo.name}
      </h2>

      {events.length > 0 ? (
        <EventSection
          title=""
          events={events}
          favorites={favorites}
          toggleFavorite={toggleFavorite}
        />
      ) : (
        <p>
          Không có sự kiện {categoryInfo.name.toLowerCase()} nào.
        </p>
      )}
    </div>
  );
}

export default CategoryPage;