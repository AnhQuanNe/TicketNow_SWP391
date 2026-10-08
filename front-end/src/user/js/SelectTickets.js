import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getMyMembership } from "../../api/membershipApi";
import { API_BASE_URL } from "../../config.js";

function SelectTicket() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchEvent = fetch(`${API_BASE_URL}/api/events/${id}`)
      .then((res) => res.json())
      .then((data) => setEvent(data))
      .catch((err) => console.error(err));

    const fetchTickets = fetch(`${API_BASE_URL}/api/tickets/event/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTickets(data || []);
        const initial = {};
        // Use `ticketType` from DB when available, otherwise fall back to `type`.
        (data || []).forEach((t) => {
          const key = t.ticketType || t.type || "";
          initial[key] = 0;
        });
        setQuantities(initial);
      })
      .catch((err) => console.error(err));

    const fetchMember = token
      ? getMyMembership(token)
          .then((res) => {
            if (res?.success) setMembership(res.data);
          })
          .catch(() => {})
      : Promise.resolve();

    Promise.all([fetchEvent, fetchTickets, fetchMember]).finally(() => setLoading(false));
  }, [id, token]);

  const handleQuantityChange = (type, value) => {
    setQuantities((prev) => {
      const newQuantity = Math.max(0, (prev[type] || 0) + value);

      // 👉 Ràng buộc 1: Nếu là vé student và user có studentId → chỉ tối đa 1 vé
      const isStudent = type.toLowerCase() === "student";
      if (isStudent && user?.studentId && newQuantity > 1) {
        Swal.fire({
          icon: "warning",
          title: "⚠️",
          text: "Bạn chỉ được mua tối đa 1 vé Student!",
          background: "#141824",
          color: "#e2e8f0",
          confirmButtonColor: "#00E599",
        });
        return prev;
      }

      // 👉 Ràng buộc 2: Tổng số vé <= 5
      const totalCurrent = Object.values(prev).reduce((a, b) => a + b, 0);
      const totalAfter = totalCurrent + value;

      if (totalAfter > 5) {
        Swal.fire({
          icon: "warning",
          title: "⚠️",
          text: "Bạn chỉ được mua tối đa 5 vé cho sự kiện này!",
          background: "#141824",
          color: "#e2e8f0",
          confirmButtonColor: "#00E599",
        });
        return prev;
      }

      return { ...prev, [type]: newQuantity };
    });
  };


  const handlePayment = () => {
    const selectedTickets = tickets
      .map((t) => {
        const key = t.ticketType || t.type || "";
        return { type: key, price: t.price, quantity: quantities[key] || 0 };
      })
      .filter((t) => t.quantity > 0);

    if (selectedTickets.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "⚠️",
        text: "Vui lòng chọn ít nhất 1 vé!",
        background: "#141824",
        color: "#e2e8f0",
        confirmButtonColor: "#00E599",
      });
      return;
    }

    const ticketSubtotal = selectedTickets.reduce((acc, t) => acc + t.price * t.quantity, 0);
    const totalQuantity = selectedTickets.reduce((acc, t) => acc + t.quantity, 0);

    // Tính phí dịch vụ và giảm giá theo hội viên
    const baseServiceFee = 20000;
    const discountPercent = membership?.discountPercent || 0;
    const discountAmount = Math.round((baseServiceFee * discountPercent) / 100);
    const finalServiceFee = Math.max(0, baseServiceFee - discountAmount);
    const finalTotalPrice = ticketSubtotal + finalServiceFee;

    // 🔹 Lưu pendingTicket đầy đủ
    localStorage.setItem(
      "pendingTicket",
      JSON.stringify({
        userId: user._id,
        eventId: event._id,
        tickets: selectedTickets,
        quantity: totalQuantity,
        ticketSubtotal,
        serviceFee: finalServiceFee,
        discountAmount,
        membershipPlan: membership?.planName || "FREE",
        price: finalTotalPrice,
      })
    );

    localStorage.setItem("eventTitle", event.title);
    localStorage.setItem("lastPaidEventId", event._id);
    // Save purchased event info for notifications
    try {
      const arr = JSON.parse(localStorage.getItem("purchasedEvents") || "[]");
      const exists = arr.some((e) => e._id === event._id);
      if (!exists) {
        arr.push({ _id: event._id, title: event.title, date: event.date });
        localStorage.setItem("purchasedEvents", JSON.stringify(arr));
      }
    } catch { }
    navigate("/payment");
  };

  if (loading) return (
    <div style={{
      textAlign: "center",
      color: "#00E599",
      background: "#0b0d13",
      minHeight: "100vh",
      paddingTop: 100,
      fontSize: "1.1rem"
    }}>
      ⏳ Đang tải dữ liệu...
    </div>
  );

  if (!event) return (
    <div style={{
      textAlign: "center",
      color: "#ff6b6b",
      background: "#0b0d13",
      minHeight: "100vh",
      paddingTop: 100,
      fontSize: "1.1rem"
    }}>
      ❌ Không tìm thấy sự kiện.
    </div>
  );

  const total = tickets.reduce((sum, t) => {
    const key = t.ticketType || t.type || "";
    return sum + (quantities[key] || 0) * t.price;
  }, 0);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* 🎵 Thông tin sự kiện */}
        <div style={styles.eventCard}>
          <div style={styles.imgWrap}>
            <img
              src={
                event.imageUrl ||
                "https://via.placeholder.com/600x350?text=No+Image"
              }
              alt={event.title}
              style={styles.eventImg}
            />
            <div style={styles.imgOverlay}></div>
          </div>
          <div style={styles.eventInfo}>
            <h2 style={styles.eventTitle}>{event.title}</h2>
            <p style={styles.eventDesc}>{event.description}</p>
            <div style={styles.eventMeta}>
              <p style={styles.metaItem}>
                <span style={styles.metaIcon}>📍</span>
                {event.locationId || "Đang cập nhật"}
              </p>
              <p style={styles.metaItem}>
                <span style={styles.metaIcon}>📅</span>
                {event.date
                  ? new Date(event.date).toLocaleDateString("vi-VN")
                  : "Chưa có"}
              </p>
            </div>
          </div>
        </div>

        {/* 🎟️ Khung chọn vé */}
        <div style={styles.ticketCard}>
          <h3 style={styles.ticketTitle}>
            <span style={styles.titleBar}></span>
            🎫 Chọn loại vé
          </h3>

          {tickets.length === 0 ? (
            <p style={{ color: "#64748b" }}>Không có loại vé nào cho sự kiện này.</p>
          ) : (
            tickets.map((ticket, index) => {
              const typeLabel = ticket.ticketType || ticket.type || "";
              const isStudentTicket = (typeLabel || "").toLowerCase() === "student" && (!user || !user.studentId);
              const qty = quantities[typeLabel] || 0;

              return (
                <div
                  key={index}
                  style={{
                    ...styles.ticketRow,
                    opacity: isStudentTicket ? 0.4 : 1,
                  }}
                >
                  <div>
                    <div style={styles.ticketType}>{typeLabel}</div>
                    <div style={styles.ticketPrice}>
                      {ticket?.price != null
                        ? ticket.price.toLocaleString()
                        : "—"}{" "}
                      VND
                    </div>
                    {isStudentTicket && (
                      <p style={styles.studentNote}>
                        * Chỉ dành cho sinh viên
                      </p>
                    )}
                  </div>

                  <div style={styles.qtyControls}>
                    <button
                      onClick={() => handleQuantityChange(typeLabel, -1)}
                      style={{
                        ...styles.qtyBtn,
                        opacity: qty === 0 ? 0.4 : 1,
                      }}
                      disabled={isStudentTicket || qty === 0}
                    >
                      −
                    </button>
                    <span style={styles.qtyNumber}>{qty}</span>
                    <button
                      onClick={() => handleQuantityChange(typeLabel, 1)}
                      style={styles.qtyBtn}
                      disabled={isStudentTicket}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {/* Chi tiết thanh toán & Giảm giá Hội viên */}
          {total > 0 && (
            <div style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              fontSize: "0.9rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                <span>Tiền vé:</span>
                <span style={{ color: "#ffffff", fontWeight: 600 }}>{total.toLocaleString()} VND</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#94a3b8" }}>
                <span>Phí dịch vụ:</span>
                <span>20,000 VND</span>
              </div>
              {membership?.discountPercent > 0 ? (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#00E599" }}>
                  <span>Ưu đãi Hội viên {membership.planName} (-{membership.discountPercent}% phí):</span>
                  <span>-{Math.round((20000 * membership.discountPercent) / 100).toLocaleString()} VND</span>
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.82rem" }}>
                  <span>Ưu đãi phí dịch vụ (Free):</span>
                  <span>0 VND (Nâng cấp Premium -5%, VIP -10%)</span>
                </div>
              )}
            </div>
          )}

          {/* Tổng tiền */}
          <div style={styles.totalRow}>
            <span style={{ color: "#94a3b8" }}>Tổng thanh toán</span>
            <span style={styles.totalPrice}>
              {(total > 0
                ? total + (20000 - Math.round((20000 * (membership?.discountPercent || 0)) / 100))
                : 0
              ).toLocaleString()}{" "}
              VND
            </span>
          </div>

          <button
            onClick={handlePayment}
            style={styles.payBtn}
            onMouseOver={(e) => {
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 6px 24px rgba(0, 229, 153, 0.45)";
            }}
            onMouseOut={(e) => {
              e.target.style.transform = "none";
              e.target.style.boxShadow = "0 4px 16px rgba(0, 229, 153, 0.3)";
            }}
          >
            💳 Thanh toán ngay
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#0b0d13",
    minHeight: "100vh",
    padding: "48px 40px 80px",
    color: "#e2e8f0",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
    display: "flex",
    gap: "32px",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  /* Event Info Card */
  eventCard: {
    flex: 1.2,
    background: "#141824",
    borderRadius: "16px",
    overflow: "hidden",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    transition: "border-color 0.3s ease",
  },
  imgWrap: {
    position: "relative",
    overflow: "hidden",
  },
  eventImg: {
    width: "100%",
    height: "340px",
    objectFit: "cover",
    display: "block",
    transition: "transform 0.6s ease",
  },
  imgOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "80px",
    background: "linear-gradient(to top, #141824, transparent)",
    pointerEvents: "none",
  },
  eventInfo: {
    padding: "20px 28px 28px",
  },
  eventTitle: {
    color: "#ffffff",
    fontSize: "1.4rem",
    fontWeight: 800,
    marginBottom: "12px",
    letterSpacing: "-0.3px",
  },
  eventDesc: {
    color: "#94a3b8",
    fontSize: "0.92rem",
    lineHeight: 1.65,
    marginBottom: "18px",
  },
  eventMeta: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  metaItem: {
    color: "#cbd5e1",
    fontSize: "0.92rem",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    margin: 0,
  },
  metaIcon: {
    fontSize: "1rem",
    flexShrink: 0,
  },
  /* Ticket Selection Card */
  ticketCard: {
    flex: 0.9,
    background: "#141824",
    borderRadius: "16px",
    padding: "28px 30px",
    border: "1px solid rgba(255, 255, 255, 0.07)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  },
  ticketTitle: {
    color: "#ffffff",
    fontSize: "1.15rem",
    fontWeight: 700,
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  titleBar: {
    display: "inline-block",
    width: "4px",
    height: "20px",
    background: "linear-gradient(180deg, #00E599, #00B4D8)",
    borderRadius: "2px",
  },
  ticketRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
    transition: "background 0.2s ease",
  },
  ticketType: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "4px",
  },
  ticketPrice: {
    fontSize: "0.92rem",
    color: "#00E599",
    fontWeight: 600,
  },
  studentNote: {
    color: "#f59e0b",
    fontSize: "0.78rem",
    marginTop: "4px",
    fontStyle: "italic",
  },
  qtyControls: {
    display: "flex",
    alignItems: "center",
    gap: "0",
  },
  qtyBtn: {
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 229, 153, 0.1)",
    color: "#00E599",
    border: "1px solid rgba(0, 229, 153, 0.25)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: "700",
    transition: "all 0.2s ease",
  },
  qtyNumber: {
    margin: "0 14px",
    fontSize: "1.1rem",
    fontWeight: 700,
    minWidth: "20px",
    textAlign: "center",
    color: "#ffffff",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    paddingTop: "18px",
    borderTop: "1px solid rgba(0, 229, 153, 0.15)",
  },
  totalPrice: {
    fontSize: "1.3rem",
    fontWeight: 800,
    color: "#00E599",
    textShadow: "0 0 12px rgba(0, 229, 153, 0.3)",
  },
  payBtn: {
    marginTop: "24px",
    width: "100%",
    padding: "14px 20px",
    background: "linear-gradient(135deg, #00E599 0%, #00B4D8 100%)",
    color: "#0b0d13",
    border: "none",
    borderRadius: "12px",
    fontSize: "1.05rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 16px rgba(0, 229, 153, 0.3)",
    letterSpacing: "0.3px",
  },
};

export default SelectTicket;