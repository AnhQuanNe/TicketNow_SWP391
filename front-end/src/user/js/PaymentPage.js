import React, { useEffect, useState, useRef } from "react";

function Payment() {
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const ranRef = useRef(false);

  useEffect(() => {
    const savedTickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const savedEventTitle = localStorage.getItem("eventTitle") || "";
    const eventId = localStorage.getItem('lastPaidEventId');
    const token = localStorage.getItem('token');
    let sum = 0;
    savedTickets.forEach((t) => {
      sum += (Number(t.price) || 0) * (Number(t.quantity) || 0);
    });

    const createPayment = async () => {
      // Guard: prevent double-run in React StrictMode (dev) or duplicate mounts
      if (ranRef.current) return;
      ranRef.current = true;
      try {
        // Tạo một orderCode và lưu tạm vào localStorage để dùng khi verify sau khi returnUrl
        const orderCode = String(Date.now());
        localStorage.setItem('lastOrderCode', orderCode);

        const res = await fetch("http://localhost:5000/api/payment/create-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            amount: sum,
            orderCode,
            description: `Thanh toán ${savedEventTitle}`.slice(0, 25), // PayOS chỉ cho 25 ký tự
            eventId,
          }),
        });
        const data = await res.json();

        // The backend now returns { checkoutUrl, payment }
        // Try to resolve a usable URL from several possible fields
        const resolved = data.checkoutUrl || data?.payment?.checkoutUrl || data?.payment?.checkout_url || data?.payment?.url || data?.payment?.redirectUrl || data?.payment?.redirect_url || data?.payment?.data?.checkoutUrl || data?.payment?.data?.checkout_url;
        setCheckoutUrl(resolved || "");

        // 🔹 Mở QR code/checkout bên ngoài
        if (resolved) {
          window.location.href = resolved;
        }
      } catch (error) {
        console.error("Lỗi tạo QR:", error);
      } finally {
        setLoading(false);
      }
    };

    createPayment();
  }, []);

  return (
    <div
      style={{
        padding: "50px 20px",
        background: "#fff0f5",
        minHeight: "100vh",
        textAlign: "center",
        color: "#333",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <h2
        style={{
          color: "#e60073",
          fontWeight: "700",
          marginBottom: "20px",
          fontSize: "28px",
        }}
      >
        💖 Thanh toán vé sự kiện
      </h2>

      <div
        style={{
          background: "#fff",
          maxWidth: "600px",
          margin: "0 auto",
          borderRadius: "20px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          padding: "30px 20px",
        }}
      >
        {loading ? (
          <p style={{ color: "#e60073", fontWeight: "bold" }}>Đang tạo link thanh toán...</p>
        ) : (
          <p style={{ color: "#e60073", fontWeight: "bold" }}>
            Nếu trình duyệt không tự mở, <a href={checkoutUrl} target="_blank" rel="noreferrer">bấm vào đây</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default Payment;
