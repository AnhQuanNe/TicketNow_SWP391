import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Bạn có thể đọc query params nếu muốn kiểm tra status
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status"); // PAID, FAILED,...
    
    // Nếu thanh toán thành công, redirect về homepage sau 2s (server-side webhook sẽ xử lý lịch nhắc)
    if (status === "PAID") {
      setTimeout(() => {
        navigate("/"); // homepage
      }, 2000);
    }
  }, [navigate]);

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "'Poppins', sans-serif" }}>
      <h2 style={{ color: "#e60073" }}>🎉 Thanh toán thành công!</h2>
      <p>Bạn sẽ được chuyển về trang chủ trong giây lát...</p>
    </div>
  );
}

export default PaymentSuccess;
