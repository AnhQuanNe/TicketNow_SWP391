import React, { useEffect, useState } from "react";

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("🧠 User trong localStorage:", user);

    if (!user || !user._id) {
      console.error("Không tìm thấy user._id hợp lệ trong localStorage");
      setError("Không tìm thấy thông tin người dùng. Hãy đăng nhập lại.");
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoading(true);
        console.log("🧠 userId:", user._id);
        const res = await fetch(`http://localhost:5000/api/bookings/${user._id}`);
        const data = await res.json();
        console.log("🎟️ Dữ liệu vé nhận được:", data);

        if (Array.isArray(data)) {
          setTickets(data);
        } else if (Array.isArray(data.bookings)) {
          setTickets(data.bookings);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error("❌ Lỗi lấy vé:", err);
        setError("Không thể tải vé. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  if (loading) return <p style={{ textAlign: "center" }}>Đang tải vé...</p>;
  if (error) return <p style={{ textAlign: "center", color: "red" }}>{error}</p>;

  // ===== Inline styles =====
  const styles = {
    container: {
      maxWidth: "800px",
      margin: "20px auto",
      padding: "0 15px",
      fontFamily: "Arial, sans-serif",
    },
    title: {
      textAlign: "center",
      marginBottom: "20px",
      color: "#333",
    },
    empty: {
      textAlign: "center",
      color: "#666",
    },
    list: {
      listStyle: "none",
      padding: 0,
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "20px",
    },
    card: {
      background: "#fff",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      padding: "15px 20px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    cardHover: {
      transform: "translateY(-5px)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    },
    cardTitle: {
      margin: 0,
      color: "#2c3e50",
      fontSize: "1.2rem",
    },
    cardText: {
      margin: 0,
      fontSize: "0.95rem",
      color: "#555",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎟️ Vé của tôi</h2>
      {tickets.length === 0 ? (
        <p style={styles.empty}>Chưa có vé nào</p>
      ) : (
        <ul style={styles.list}>
          {tickets.map((t) => (
            <li
              key={t._id || t.id}
              style={styles.card}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.cardHover)}
              onMouseLeave={(e) =>
                Object.assign(e.currentTarget.style, {
                  transform: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                })
              }
            >
              <h3 style={styles.cardTitle}>{t.eventId?.title || "Không rõ sự kiện"}</h3>
<p style={styles.cardText}>
  📍 {t.eventId?.locationId?.name || "Chưa có địa điểm"}
</p>
<p style={styles.cardText}>
  📅 {t.eventId?.date ? new Date(t.eventId.date).toLocaleDateString() : "Chưa có ngày"}
</p>
<p style={styles.cardText}>💰 {t.totalPrice ?? "Chưa có giá"} VNĐ</p>


            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
