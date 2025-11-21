import React, { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import "../css/CheckinPage.css";

function CheckinPage() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const API_URL = "http://10.12.80.56:5000/api/bookings/checkin";

  const handleCheckin = async (rawText) => {
    try {
      const url = new URL(rawText);
      const token = url.searchParams.get("token");
      const eventId = url.searchParams.get("eventId");

      if (!token || !eventId) {
        setResult({ status: "error", message: "QR không hợp lệ!" });
        return;
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventId }),
      });

      const data = await res.json();
      const ok = res.ok;

      setResult({
        status: ok ? "success" : "error",
        message: data.message,
      });

      setHistory((prev) => [
        {
          token,
          status: ok ? "success" : "error",
          msg: data.message,
          time: new Date(),
        },
        ...prev,
      ]);
    } catch (err) {
      setResult({ status: "error", message: "Lỗi check-in!" });
    }
  };

  useEffect(() => {
    let html5QrCode = null;
    let isMounted = true;
    let scannerStarted = false;

    const startScanner = async () => {
      try {
        const reader = document.getElementById("qr-reader");
        if (reader) reader.innerHTML = ""; // CLEAR UI cũ

        html5QrCode = new Html5Qrcode("qr-reader");

        const cameras = await Html5Qrcode.getCameras();
        if (!isMounted || cameras.length === 0) return;

        const cameraId = cameras[0].id;

        scannerStarted = true;

        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1,
          },
          (decodedText) => handleCheckin(decodedText),
          () => {}
        );
      } catch (err) {
        console.error("Start scanner error:", err);
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode && scannerStarted) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch(() => {
            // ignore error "not running"
          });
      }
    };
  }, []);

  return (
    <div className="checkin-container">
      <h1 className="checkin-title">Check-in Vé</h1>

      <div className="qr-section">
        <div id="qr-reader" className="qr-reader"></div>
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
                <td className={h.status}>{h.msg}</td>
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