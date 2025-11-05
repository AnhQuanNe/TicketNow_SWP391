import React, { useEffect, useState, useRef } from "react";

function Payment() {
  const [loading, setLoading] = useState(true);
  const hasCreated = useRef(false);

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
      // Guard: prevent double-run in React StrictMode (dev) or duplicate mounts
      if (ranRef.current) return;
      ranRef.current = true;
      try {
        const orderCode = Date.now(); // 👉 dùng làm paymentId duy nhất

        const res = await fetch("http://localhost:5000/api/payment/create-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
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
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>💳 Đang xử lý thanh toán...</h2>
      {loading && <p>⏳ Đang tạo link thanh toán, vui lòng chờ...</p>}
    </div>
  );
}

export default Payment;
