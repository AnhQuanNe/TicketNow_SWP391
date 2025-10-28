import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Khi trả về từ PayOS, gọi /api/payment/verify để xác nhận thanh toán và cập nhật booking
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status"); // PAID, FAILED,...
    const orderCodeFromQuery = params.get('orderCode') || params.get('order_id') || params.get('order');

    const verifyPayment = async () => {
      try {
        const orderCode = orderCodeFromQuery || localStorage.getItem('lastOrderCode');
        if (!orderCode) {
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ orderCode }),
        });
        const data = await res.json();
        localStorage.removeItem('lastOrderCode');
        if (data?.ok) setTimeout(() => navigate('/'), 2000);
        else {
          console.warn('Verify response:', data);
          setTimeout(() => navigate('/'), 3000);
        }
      } catch (e) {
        console.error('Lỗi verify thanh toán:', e);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    verifyPayment();
  }, [navigate]);

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "'Poppins', sans-serif" }}>
      <h2 style={{ color: "#e60073" }}>🎉 Thanh toán thành công!</h2>
      <p>Bạn sẽ được chuyển về trang chủ trong giây lát...</p>
    </div>
  );
}

export default PaymentSuccess;
