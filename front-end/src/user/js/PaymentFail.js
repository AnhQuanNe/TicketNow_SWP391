import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function PaymentFail() {
  const navigate = useNavigate();

  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");

      if (status !== "cancel") {
        Swal.fire("❌ Thanh toán thất bại", "", "error");
        return navigate("/");
      }

      // 🟢 Tìm đúng key lưu data trước thanh toán
      const pending =
        JSON.parse(localStorage.getItem("pendingTicket")) ||
        JSON.parse(localStorage.getItem("pendingOrder")) ||
        JSON.parse(localStorage.getItem("pendingPayment")) ||
        {};

      if (!pending.userId || !pending.eventId || !pending.tickets) {
        Swal.fire("⚠ Không tìm thấy dữ liệu để tạo vé canceled", "", "warning");
        return navigate("/");
      }

      // 🟢 Gửi request và CHỜ nó chạy xong
      await fetch(`${process.env.REACT_APP_API_URL}/bookings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pending.userId,
          eventId: pending.eventId,
          tickets: pending.tickets,
          userEmail: pending.userEmail,
          paymentId: pending.paymentId,
          paymentStatus: "PAYMENT_CANCELED",
        }),
      });

      Swal.fire("⚠ Bạn đã hủy thanh toán", "Vé đã được lưu dạng CANCELED", "warning");

      navigate("/my-tickets");
    }

    run();
  }, []);

  return null;
}

export default PaymentFail;
