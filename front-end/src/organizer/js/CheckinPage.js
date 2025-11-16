import React, { useState, useEffect } from "react";
import { FaCamera, FaSearch } from "react-icons/fa";
import { Html5QrcodeScanner } from "html5-qrcode";
import "../css/CheckinPage.css";

function CheckinPage() {
  const [result, setResult] = useState(null);
  const [manualToken, setManualToken] = useState("");
  const [manualEventId, setManualEventId] = useState("");
  const [history, setHistory] = useState([]);

  const handleCheckin = async (rawText) => {
    try {
      const raw = rawText?.decodedText || rawText;

      let token = "";
      let eventId = "";

      // Nếu raw là URL đúng
      try {
        const url = new URL(raw);
        token = url.searchParams.get("token");
        eventId = url.searchParams.get("eventId");
      } catch (_) {}

      if (!token || !eventId) {
        setResult({
          status: "error",
          message: "QR không hợp lệ hoặc thiếu token/eventId!",
        });
        return;
      }

      // Gửi API
      const res = await fetch("http://localhost:5000/api/bookings/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventId }),
      });

      const data = await res.json();
      const status = res.ok ? "success" : "error";

      setResult({ status, message: data.message });
      setHistory((prev) => [
        { token, status, message: data.message, time: new Date() },
        ...prev,
      ]);
    } catch (err) {
      setResult({ status: "error", message: "Lỗi kết nối server!" });
    }
  };

  // QR Scanner auto run
  useEffect(() => {
    const el = document.getElementById("qr-reader");
    if (el) el.innerHTML = ""; // 💥 FIX CAMERA BỊ NHÂN ĐÔI

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 300 },
      false
    );

    scanner.render(
      (decoded) => handleCheckin(decoded),
      (err) => console.log("SCAN ERROR:", err)
    );

    return () => scanner.clear();
  }, []);

  return (
    <div className="checkin-container">
      <h1 className="checkin-title">Check-in Vé</h1>

      <div className="qr-section">
        <h3><FaCamera /> Quét mã QR</h3>
        <div id="qr-reader" className="qr-reader"></div>
      </div>

      <div className="manual-section">
        <h3><FaSearch /> Nhập token + eventId</h3>

        <input
          type="text"
          placeholder="token..."
          value={manualToken}
          onChange={(e) => setManualToken(e.target.value)}
        />

        <input
          type="text"
          placeholder="eventId..."
          value={manualEventId}
          onChange={(e) => setManualEventId(e.target.value)}
        />

        <button
          onClick={() =>
            handleCheckin(
              `https://local.fake?token=${manualToken}&eventId=${manualEventId}`
            )
          }
        >
          Check-in
        </button>
      </div>

      {result && (
<div className={`checkin-result ${result.status}`}>
          {result.message}
        </div>
      )}

      <div className="history-section">
        <h3>Lịch sử Check-in</h3>
        <table>
          <thead>
            <tr>
              <th>Token</th>
              <th>Kết quả</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td>{h.token}</td>
                <td className={h.status}>{h.message}</td>
                <td>{h.time.toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CheckinPage;