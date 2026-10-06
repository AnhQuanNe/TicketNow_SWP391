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

  const categoryMap = {
    music: { id: "cat_music", name: "Âm nhạc" },
    workshop: { id: "cat_workshop", name: "Workshop / Kỹ năng" },
    sport: { id: "cat_sport", name: "Thể thao" },
    market: { id: "cat_market", name: "Hội chợ" },
  };

  const categoryInfo = categoryMap[incomingKey];

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

        // 🔥 FIX CHÍNH: Hỗ trợ string hoặc object khi populate
        const filtered = data.filter((ev) => {
          // ❗ Chặn event đã bị xóa
          if (ev.status !== "active") return false;

          if (!ev.categoryId) return false;

          if (typeof ev.categoryId === "string") {
            return ev.categoryId === categoryInfo.id;
          }

          if (typeof ev.categoryId === "object") {
            return ev.categoryId._id === categoryInfo.id;
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