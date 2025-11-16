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
        for (const ticket of pending.tickets) {
          await fetch("http://localhost:5000/api/bookings/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: pending.userId,
              eventId: pending.eventId,
              quantity: ticket.quantity,
              totalPrice: ticket.price * ticket.quantity,
              paymentId: pending.paymentId + "_" + ticket.type,
              userEmail: pending.userEmail,
              ticketType: ticket.type.toLowerCase(), // REQUIRED
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