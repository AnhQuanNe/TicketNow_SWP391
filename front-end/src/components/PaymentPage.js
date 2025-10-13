import React, { useEffect, useState } from "react";

function Payment() {
  const [tickets, setTickets] = useState([]);
  const [eventTitle, setEventTitle] = useState("");
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const savedTickets = JSON.parse(localStorage.getItem("tickets")) || [];
    const savedEventTitle = localStorage.getItem("eventTitle") || "";

    setTickets(savedTickets);
    setEventTitle(savedEventTitle);

   
    let sum = 0;
    savedTickets.forEach((t) => {
      sum += (Number(t.price) || 0) * (Number(t.quantity) || 0);
    });
    setTotal(sum);
  }, []);

  return (
    <div style={{ padding: "30px", background: "#121212", color: "#fff", minHeight: "100vh" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Thanh toán vé</h1>
      <h2 style={{ textAlign: "center", marginBottom: "20px", color: "#1db954" }}>
        {eventTitle || "Chưa chọn sự kiện"}
      </h2>

      <div style={{ maxWidth: "600px", margin: "0 auto", background: "#1e1e1e", padding: "20px", borderRadius: "12px" }}>
        {tickets.length > 0 ? (
          tickets.map((t, idx) => (
            <p key={idx}>
              {t.quantity} x {t.type} ({t.price.toLocaleString()}đ) ={" "}
              {(t.price * t.quantity).toLocaleString()}đ
            </p>
          ))
        ) : (
          <p style={{ color: "red" }}>⚠️ Bạn chưa chọn vé nào.</p>
        )}
        <hr />
        <h3>Tổng cộng: {total.toLocaleString()}đ</h3>
      </div>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <h2>Quét mã QR để thanh toán</h2>
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?data=ThanhToan%20${total}`}
          alt="QR"
        />
      </div>
    </div>
  );
}

export default Payment;
