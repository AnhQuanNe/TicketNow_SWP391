import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/events/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Không tìm thấy sự kiện");
        return res.json();
      })
      .then((data) => {
        setEvent({
          ...data,
          // ✅ map đúng trường từ database
          imageURL: data.imageUrl || "https://via.placeholder.com/900x400?text=No+Image"
        });
      })
      .catch((err) => console.error(err));
  }, [id]);


  if (!event)
    return (
      <div style={{ textAlign: "center", color: "#ff4da6", marginTop: 50 }}>
        ❌ Không tìm thấy sự kiện.
      </div>
    );

  const handleBuyTicket = () => {
    const loggedIn = localStorage.getItem("user");
    if (!loggedIn) navigate("/login");
    else navigate(`/select-ticket/${event._id}`);
  };

  const styles = {
    page: {
      backgroundColor: "#ffe6f2",
      color: "#333",
      fontFamily: "Poppins, sans-serif",
      minHeight: "100vh",
      paddingBottom: "60px",
    },
    banner: {
      position: "relative",
      width: "100%",
      height: "420px",
      overflow: "hidden",
      borderBottom: "4px solid #ff4da6",
    },
    bannerImg: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      filter: "brightness(80%)",
    },
    bannerOverlay: {
      position: "absolute",
      bottom: "30px",
      left: "60px",
      color: "#fff",
      textShadow: "0 2px 6px rgba(0, 0, 0, 0.4)",
    },
    title: {
      fontSize: "2.6rem",
      marginBottom: "10px",
      color: "#fff",
      fontWeight: 700,
    },
    subtitle: {
      fontSize: "1.1rem",
      opacity: 0.95,
    },
    content: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "40px",
      margin: "60px auto",
      width: "80%",
      flexWrap: "wrap",
    },
    description: {
      flex: 1.5,
      background: "#fff",
      padding: "25px 30px",
      borderRadius: "16px",
      boxShadow: "0 0 12px rgba(255, 77, 166, 0.2)",
      minWidth: "300px",
    },
    descTitle: {
      color: "#ff4da6",
      marginBottom: "15px",
      fontWeight: "600",
    },
    infoBox: {
      flex: 1,
      background: "#fff",
      borderRadius: "16px",
      padding: "25px 30px",
      boxShadow: "0 0 15px rgba(255, 77, 166, 0.25)",
      border: "1px solid #ffd6eb",
      minWidth: "280px",
    },
    infoText: {
      marginBottom: "12px",
      fontSize: "1.05rem",
      color: "#444",
    },
    btn: {
      width: "100%",
      marginTop: "20px",
      padding: "14px 0",
      background: "linear-gradient(90deg, #ff66b2, #ff4da6)",
      color: "#fff",
      fontWeight: 600,
      fontSize: "1.1rem",
border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "0.3s",
      boxShadow: "0 4px 12px rgba(255, 77, 166, 0.3)",
    },
  };

  return (
    <div style={styles.page}>
      {/* Banner */}
      <div style={styles.banner}>
        <img
          src={event.imageURL || "https://via.placeholder.com/900x400?text=No+Image"}
          alt={event.title}
          style={styles.bannerImg}
        />
        <div style={styles.bannerOverlay}>
          <h1 style={styles.title}>{event.title}</h1>
          <p style={styles.subtitle}>
            📅 {new Date(event.date).toLocaleDateString()} - 🕓{" "}
            {new Date(event.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p style={styles.subtitle}>📍 {event.locationId}</p>
        </div>
      </div>

      {/* Nội dung chi tiết */}
      <div style={styles.content}>
        <div style={styles.description}>
          <h2 style={styles.descTitle}>🎀 Giới thiệu sự kiện</h2>
          <p>{event.description}</p>
        </div>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            <b>🎫 Vé còn lại:</b> {event.ticketsAvailable}
          </p>
          <p style={styles.infoText}>
            <b>📍 Địa điểm:</b> {event.locationId}
          </p>
          <p style={styles.infoText}>
            <b>🗓️ Thời gian:</b> {new Date(event.date).toLocaleString()}
          </p>

          <button
            style={styles.btn}
            onMouseEnter={(e) =>
            (e.target.style.background =
              "linear-gradient(90deg, #ff80bf, #ff99cc)")
            }
            onMouseLeave={(e) =>
            (e.target.style.background =
              "linear-gradient(90deg, #ff66b2, #ff4da6)")
            }
            onClick={handleBuyTicket}
          >
            💖 Mua vé ngay
          </button>
        </div>
      </div>
    </div>
  );
}

export default EventDetail;