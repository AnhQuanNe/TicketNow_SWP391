import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function PaymentSuccess() {
  const navigate = useNavigate();
  const hasRun = useRef(false); // ✅ đảm bảo chỉ chạy 1 lần

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const saveBooking = async () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");

      if (status !== "PAID") {
        Swal.fire("❌ Thanh toán thất bại", "Vui lòng thử lại!", "error");
        setTimeout(() => navigate("/"), 3000);
        return;
      }

      const pendingTicket = JSON.parse(localStorage.getItem("pendingTicket"));
      if (!pendingTicket) {
        Swal.fire("⚠️ Lỗi", "Không tìm thấy thông tin vé!", "error");
        navigate("/");
        return;
      }

      try {
        // include ticketType (take first selected ticket type if multiple)
        const firstTicketType = pendingTicket.tickets && pendingTicket.tickets.length ? (pendingTicket.tickets[0].ticketType || pendingTicket.tickets[0].type) : null;
        const res = await fetch("http://localhost:5000/api/payment/payment-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: pendingTicket.userId,
            eventId: pendingTicket.eventId,
            quantity: pendingTicket.quantity || 1,
            totalPrice: pendingTicket.price,
            paymentId: pendingTicket.paymentId,
            ticketType: firstTicketType,
          }),
        });

        if (res.ok) {
          Swal.fire("🎉 Thành công!", "Vé của bạn đã được lưu!", "success");
          localStorage.removeItem("pendingTicket");
          setTimeout(() => navigate("/my-tickets"), 2000);
        } else {
          const data = await res.json();
          Swal.fire("❌ Lỗi", data.message || "Không thể lưu vé!", "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("❌ Lỗi", "Không thể kết nối máy chủ!", "error");
      }
    };

    saveBooking();
  }, []); // ⚠️ bỏ [navigate], để effect chỉ chạy 1 lần

  return null;
}

export default PaymentSuccess;
