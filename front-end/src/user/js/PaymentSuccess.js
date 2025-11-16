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
        const ticketsLower = pending.tickets.map(t => ({
          ...t,
          type: t.type.toLowerCase()
        }));

        const res = await fetch("http://localhost:5000/api/bookings/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: pending.userId,
            eventId: pending.eventId,
            tickets: ticketsLower,
            paymentId: pending.paymentId,
            userEmail: pending.userEmail,

            // ⭐⭐⭐ THÊM DÒNG NÀY — RẤT QUAN TRỌNG ⭐⭐⭐
            paymentStatus: "PAYMENT_SUCCESS"
          }),
        });

        const data = await res.json();
        console.log("Booking response:", data);

        if (!res.ok) {
          Swal.fire("❌ Lỗi server", data.message || "Không tạo được vé", "error");
          return;
        }

        Swal.fire("🎉 Thành công!", "Vé đã được lưu!", "success");

        localStorage.removeItem("pendingTicket");

        setTimeout(() => navigate("/my-tickets"), 1200);

      } catch (err) {
        Swal.fire("❌ Lỗi server", "", "error");
      }
    };

    saveBooking();
  }, []);

  return null;
}

export default PaymentSuccess;
