// front-end/src/admin/js/Reports.js
import React, { useEffect, useState } from "react";
import { fetchAdminReports, fetchEventReport } from "../api/reportApi";
import { adminFetchEvents } from "../api/eventAdminApi";
import "../css/Reports.css";

// ⭐ THÊM MỚI — xuất PDF
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
);

export default function Reports() {
  const [report, setReport] = useState(null);

  const [showEventList, setShowEventList] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventReport, setEventReport] = useState(null);

  // ===============================
  // 📌 Load Report Tổng
  // ===============================
  useEffect(() => {
    fetchAdminReports().then((data) => {
      console.log("📊 ADMIN REPORT:", data);
      setReport(data);
    });
  }, []);

  // ===============================
  // 📌 Load danh sách sự kiện khi bật chế độ xem sự kiện
  // ===============================
  useEffect(() => {
    if (showEventList) {
      adminFetchEvents().then((data) => {
        setEvents(data.events || []);
      });
    }
  }, [showEventList]);

  // ===============================
  // 📌 Load Report theo sự kiện
  // ===============================
  const loadEventReport = async (eventId) => {
    const data = await fetchEventReport(eventId);
    setSelectedEvent(eventId);
    setEventReport(data);
  };

  // ⭐ THÊM MỚI — FUNCTION XUẤT PDF
  const exportPDF = async () => {
    const input = document.getElementById("report-content");
    if (!input) return alert("Không tìm thấy nội dung để xuất PDF");

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

    pdf.save(
      selectedEvent && eventReport
        ? `BaoCao_SuKien_${eventReport.title}.pdf`
        : "BaoCao_TongQuan.pdf"
    );
  };

  if (!report) return <p>⏳ Đang tải báo cáo...</p>;

  const pie = report?.pieCounts || { student: 0, guest: 0, remaining: 0 };
  const student = pie.student;
  const guest = pie.guest;
  const remaining = pie.remaining;

  const ratings = report?.ratingDistribution || [];
  const revenue = report?.revenueByMonth || [];

  return (
    // ⭐ BỌC TOÀN BỘ NỘI DUNG REPORT
<div id="report-content" style={{ padding: "20px" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 25,
        }}
      >
        <h2 className="fw-bold">📊 Báo cáo & Thống kê</h2>

        <div style={{ display: "flex", gap: 10 }}>
          {/* ⭐ THÊM NÚT XUẤT PDF */}
          <button
            onClick={exportPDF}
            style={{
              padding: "10px 18px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            📄 Xuất PDF
          </button>

          <button
            onClick={() => {
              setShowEventList(!showEventList);
              setSelectedEvent(null);
              setEventReport(null);
            }}
            style={{
              padding: "10px 18px",
              background: showEventList ? "#ff7a18" : "#4f86ff",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {showEventList
              ? "⬅️ Quay về báo cáo tổng"
              : "📅 Báo cáo theo sự kiện"}
          </button>
        </div>
      </div>

      {/* =============================
          DANH SÁCH SỰ KIỆN
      ============================== */}
      {showEventList && !selectedEvent && (
        <div style={{ marginBottom: 30 }}>
          <h3 className="fw-bold mb-3">📅 Danh sách sự kiện</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "16px",
            }}
          >
            {events.map((ev) => (
              <div
                key={ev._id}
                onClick={() => loadEventReport(ev._id)}
                style={{
                  padding: "20px",
                  background: "white",
                  borderRadius: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  borderLeft: "6px solid #4f86ff",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-4px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <h4 style={{ marginBottom: 6 }}>{ev.title}</h4>
                <p style={{ color: "#777" }}>
                  📅 {new Date(ev.date).toLocaleDateString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =============================
          BÁO CÁO CHI TIẾT SỰ KIỆN
============================== */}
      {selectedEvent && eventReport && (
        <div style={{ marginBottom: 40 }}>
          <h3 className="fw-bold mb-4">
            📈 Báo cáo sự kiện: {eventReport.title}
          </h3>

          {/* SUMMARY CARDS */}
          <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
            <SummaryCard
              title="Tổng đơn"
              value={eventReport.totalOrders}
              color="#4f86ff"
            />
            <SummaryCard
              title="Vé đã bán"
              value={
                eventReport.pieCounts.student + eventReport.pieCounts.guest
              }
              color="#10b981"
            />
            <SummaryCard
              title="Doanh thu"
              value={eventReport.totalRevenue.toLocaleString("vi-VN") + " đ"}
              color="#ff7a18"
            />
          </div>

          {/* PIE CHART */}
          <div className="chart-box" style={{ marginBottom: 30 }}>
            <h4 className="fw-bold">🎟️ Tỷ lệ loại vé</h4>
            <Pie
              data={{
                labels: [
                  `Student (${eventReport.pieCounts.student})`,
                  `Guest (${eventReport.pieCounts.guest})`,
                  `Remaining (${eventReport.pieCounts.remaining})`,
                ],
                datasets: [
                  {
                    data: [
                      eventReport.pieCounts.student,
                      eventReport.pieCounts.guest,
                      eventReport.pieCounts.remaining,
                    ],
                    backgroundColor: ["#4f86ff", "#ff7a18", "#bfbfbf"],
                  },
                ],
              }}
            />
          </div>

          {/* RATING CHART */}
          <div className="chart-box" style={{ marginBottom: 30 }}>
            <h4 className="fw-bold">⭐ Phân loại đánh giá</h4>
            <Bar
              data={{
                labels: eventReport.ratingDistribution.map(
                  (r) => `${r.rating} sao`
                ),
                datasets: [
                  {
                    label: "Số lượng",
                    data: eventReport.ratingDistribution.map((r) => r.count),
                    backgroundColor: "#10b981",
                  },
                ],
              }}
            />
          </div>

          <button
            onClick={() => {
              setSelectedEvent(null);
              setEventReport(null);
            }}
            style={{
              marginTop: 15,
              padding: "10px 18px",
              background: "#ff7a18",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            ⬅️ Quay lại danh sách sự kiện
          </button>
        </div>
      )}

      {/* =============================
BÁO CÁO TỔNG
      ============================== */}
      {!showEventList && (
        <>
          {/* SUMMARY CARDS */}
          <div style={{ display: "flex", gap: 20, marginBottom: 30 }}>
            <SummaryCard
              title="Tổng sự kiện"
              value={report.totalEvents || 0}
              color="#4f86ff"
            />
            <SummaryCard
              title="Tổng đơn đặt"
              value={report.totalOrders || 0}
              color="#10b981"
            />
            <SummaryCard
              title="Tổng doanh thu"
              value={report.totalRevenue.toLocaleString("vi-VN") + " đ"}
              color="#ff7a18"
            />
          </div>

          {/* PIE */}
          <div className="chart-box" style={{ marginBottom: 30 }}>
            <h4 className="fw-bold">🎟️ Tỷ lệ loại vé</h4>
            <Pie
              data={{
                labels: [
                  `Student (${student})`,
                  `Guest (${guest})`,
                  `Remaining (${remaining})`,
                ],
                datasets: [
                  {
                    data: [student, guest, remaining],
                    backgroundColor: ["#4f86ff", "#ff7a18", "#bfbfbf"],
                  },
                ],
              }}
            />
          </div>

          {/* RATING */}
          <div className="chart-box" style={{ marginBottom: 30 }}>
            <h4 className="fw-bold">⭐ Phân loại đánh giá</h4>

            <Bar
              data={{
                labels: ratings.map((r) => `${r.rating} sao`),
                datasets: [
                  {
                    label: "Số lượng",
                    data: ratings.map((r) => r.count),
                    backgroundColor: "#10b981",
                  },
                ],
              }}
            />
          </div>

          {/* REVENUE */}
          <div className="chart-box">
            <h4 className="fw-bold">📈 Doanh thu theo tháng</h4>

            <Line
              data={{
                labels: revenue.map((m) => m.monthLabel),
                datasets: [
                  {
                    label: "Doanh thu (VND)",
                    data: revenue.map((m) => m.total),
                    borderColor: "#4f86ff",
                    backgroundColor: "rgba(79,134,255,0.25)",
                    fill: true,
                    tension: 0.3,
                  },
                ],
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ==========================================
   SUMMARY CARD
========================================== */
function SummaryCard({ title, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        padding: 20,
        borderRadius: 12,
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        borderLeft: `6px solid ${color}`,
      }}
    >
<h4 style={{ marginBottom: 10, color: "#7d7d7d" }}>{title}</h4>
      <h2 style={{ color, fontWeight: "bold" }}>{value}</h2>
    </div>
  );
}
