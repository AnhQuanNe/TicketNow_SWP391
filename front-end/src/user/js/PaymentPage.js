import React, { useEffect, useState } from "react";

function Payment() {
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedTickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const savedEventTitle = localStorage.getItem("eventTitle") || "";
    let sum = 0;
    savedTickets.forEach((t) => {
      sum += (Number(t.price) || 0) * (Number(t.quantity) || 0);
    });

    const createPayment = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/payment/create-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: sum,
            orderCode: Date.now(),
            description: `Thanh toán ${savedEventTitle}`.slice(0, 25), // PayOS chỉ cho 25 ký tự
          }),
        });
        const data = await res.json();
        setCheckoutUrl(data.checkoutUrl);

        // 🔹 Mở QR code/checkout bên ngoài
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
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
