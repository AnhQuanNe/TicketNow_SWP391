import React, { useEffect, useState } from "react";

function Favorites() {
  const [favoriteEvents, setFavoriteEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId"); // hoặc token decode

  useEffect(() => {
    async function fetchFavorites() {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${userId}/favorites`);
        const data = await res.json();
        setFavoriteEvents(data);
      } catch (err) {
        console.error("Lỗi khi tải sự kiện yêu thích:", err);
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchFavorites();
  }, [userId]);

  if (loading) return <p>Đang tải...</p>;
  if (favoriteEvents.length === 0) return <p>Bạn chưa tim sự kiện nào 💔</p>;

  return (
    <section className="favorites-section">
      <div className="section-header"><h2>❤️ Sự kiện yêu thích của bạn</h2></div>
      <div className="scroll-row">
        {favoriteEvents.map(ev => (
          <div className="suggest-card" key={ev._id}>
            <img
              src={ev.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
              alt={ev.title}
            />
            <h4>{ev.title}</h4>
            <p>{ev.categoryName || ev.categoryId}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Favorites;
