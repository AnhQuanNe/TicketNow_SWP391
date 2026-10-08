import React, { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../../config.js";

function Payment() {
  const [loading, setLoading] = useState(true);
  const hasCreated = useRef(false);

  // 🟢 [THÊM MỚI] — dùng để chặn việc chạy lại hàm createPayment nhiều lần
  const ranRef = useRef(false);

  // 🟢 [THÊM MỚI] — lấy token người dùng từ localStorage (nếu có)
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (hasCreated.current) return;
    hasCreated.current = true;

    const pendingTicket = JSON.parse(localStorage.getItem("pendingTicket"));
    const eventTitle = localStorage.getItem("eventTitle") || "Sự kiện";

    console.log("📦 Payment page debug:", pendingTicket);

    if (!pendingTicket?.userId || !pendingTicket?.eventId || !pendingTicket?.price) {
      alert("❌ Thiếu thông tin thanh toán");
      setLoading(false);
      return;
    }

    const createPayment = async () => {
      // 🟢 [ĐÃ SỬA] — thêm điều kiện kiểm tra ranRef để tránh chạy 2 lần
      if (ranRef.current) return;
      ranRef.current = true;

      try {
        const orderCode = Date.now(); // 👉 dùng làm paymentId duy nhất

        const res = await fetch(`${API_BASE_URL}/api/payment/create-payment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // 🟢 [ĐÃ SỬA] — thêm token nếu có
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            amount: pendingTicket.price,
            orderCode,
            description: `Thanh toán ${eventTitle}`.slice(0, 25),
          }),
        });

        const data = await res.json();
        console.log("Payment create response:", data);

        if (data.checkoutUrl) {
          pendingTicket.paymentId = orderCode; // ✅ lưu để PaymentSuccess dùng
          localStorage.setItem("pendingTicket", JSON.stringify(pendingTicket));
          window.location.href = data.checkoutUrl;
        } else {
          alert("❌ Không tạo được link thanh toán!");
        }
      } catch (err) {
        console.error("❌ Lỗi tạo link thanh toán:", err);
        alert("❌ Không thể kết nối máy chủ!");
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, [token]); // 🟢 [ĐÃ SỬA] — thêm token vào dependency để ESLint không cảnh báo

  return (
    <div style={{
      textAlign: "center",
      minHeight: "100vh",
      background: "#0b0d13",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#e2e8f0",
    }}>
      <div style={{
        background: "#141824",
        padding: "40px 48px",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}>
        <h2 style={{ color: "#ffffff", marginBottom: "12px" }}>💳 Đang xử lý thanh toán...</h2>
        {loading && <p style={{ color: "#00E599" }}>⏳ Đang tạo link thanh toán, vui lòng chờ...</p>}
      </div>
    </div>
  );
}

export default Payment;