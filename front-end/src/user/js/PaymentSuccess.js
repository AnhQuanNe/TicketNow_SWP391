import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function PaymentSuccess() {
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const saveBooking = async () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");

      if (status !== "PAID") {
        Swal.fire("❌ Thanh toán thất bại", "", "error");
        return navigate("/");
      }

      const pending = JSON.parse(localStorage.getItem("pendingTicket"));
      if (!pending) return navigate("/");

      try {
        const normalizeTicketType = (t) => {
          if (!t) return t;
          // If already matches backend enum, return as-is
          if (t === "Student" || t === "Guest") return t;
          const lower = t.toString().toLowerCase();
          if (lower === "student") return "Student";
          if (lower === "guest") return "Guest";
          // Fallback: capitalize first letter
          return t.charAt(0).toUpperCase() + t.slice(1);
        };

        for (const ticket of pending.tickets) {
          const normalizedType = normalizeTicketType(ticket.type);
          await fetch("http://localhost:5000/api/bookings/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: pending.userId,
              eventId: pending.eventId,
              quantity: ticket.quantity,
              totalPrice: ticket.price * ticket.quantity,
              paymentId: (pending.paymentId || "") + "_" + (ticket.type || ""),
              userEmail: pending.userEmail,
              ticketType: normalizedType, // use enum-correct value
            }),
          });
        }

        Swal.fire("🎉 Thành công!", "Vé đã được lưu!", "success");
        localStorage.removeItem("pendingTicket");
        setTimeout(() => navigate("/my-tickets"), 1500);

      } catch (err) {
        Swal.fire("❌ Lỗi server", "", "error");
      }
    };

    saveBooking();
  }, []);

  return null;
}

export default PaymentSuccess;
