import React, { useState } from "react";
import { QrReader } from "react-qr-reader";
import Swal from "sweetalert2";

export default function QRScanner({ mode = "checkin" }) {
  const [scanResult, setScanResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleScan = async (result) => {
    if (!result?.text || loading) return;

    try {
      setLoading(true);
      setScanResult(result.text);

      const qrData = JSON.parse(result.text);
      const bookingId = qrData.bookingId;

      if (!bookingId) {
        Swal.fire("Lỗi", "QR không hợp lệ hoặc thiếu bookingId", "error");
        return;
      }

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/bookings/${mode}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        Swal.fire("Thành công ✅", data.message, "success");
      } else {
        Swal.fire("Thất bại ❌", data.message || "Có lỗi xảy ra", "error");
      }
    } catch (err) {
      console.error("❌ Lỗi khi xử lý QR:", err);
      Swal.fire("Lỗi", "Không thể xử lý mã QR", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (err) => {
    console.error("QR Error:", err);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">
        {mode === "checkin" ? "📥 Quét mã QR Check-In" : "📤 Quét mã QR Check-Out"}
      </h1>

      <div className="w-80 h-80 border-4 border-blue-500 rounded-xl overflow-hidden shadow-lg">
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: "environment" }}
          scanDelay={500}
          onError={handleError}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {scanResult && (
        <p className="mt-4 text-gray-600">
          📄 Dữ liệu quét: <span className="font-mono">{scanResult}</span>
        </p>
      )}
    </div>
  );
}
