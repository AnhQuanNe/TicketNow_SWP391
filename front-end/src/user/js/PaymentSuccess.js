import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const saveTicket = async () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");

      // ✅ Lấy thông tin từ URL hoặc fallback sang localStorage
      const storedTicket = JSON.parse(localStorage.getItem("pendingTicket")) || {};
      const userId = params.get("userId") || storedTicket.userId;
      const eventId = params.get("eventId") || storedTicket.eventId;
      const price = params.get("price") || storedTicket.price;
      const quantity = params.get("quantity") || storedTicket.quantity || 1;

      console.log("Thông tin vé nhận được:", { status, userId, eventId, price, quantity });

      if (status === "PAID" && userId && eventId && price) {
        try {
          const res = await fetch("http://localhost:5000/api/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, eventId, price, quantity }),
          });

          if (res.ok) {
            Swal.fire("🎉 Thành công!", "Vé của bạn đã được lưu!", "success");
            localStorage.removeItem("pendingTicket"); // Xóa vé tạm để tránh lưu trùng
            setTimeout(() => navigate("/my-tickets"), 2000);
          } else {
            Swal.fire("Lỗi", "Không thể lưu vé!", "error");
          }
        } catch (err) {
          console.error("Lỗi lưu vé:", err);
          Swal.fire("Lỗi", "Không thể kết nối máy chủ!", "error");
        }
      } else {
        Swal.fire("Thanh toán thất bại", "Thiếu thông tin cần thiết!", "error");
        setTimeout(() => navigate("/"), 2500);
      }
    };

    saveTicket();
  }, [navigate]);

  return (
    <div
      style={{
        padding: "50px",
        textAlign: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <h2 style={{ color: "#e60073" }}>🎉 Thanh toán thành công!</h2>
      <p>Đang xử lý vé của bạn...</p>
    </div>
  );
}

export default PaymentSuccess;
