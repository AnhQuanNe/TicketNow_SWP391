// front-end/src/admin/js/Reports.js
import React, { useEffect, useState } from "react";
import { fetchAdminReports } from "../api/eventAdminApi";
import "../css/Reports.css";


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

// Register ChartJS components
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

  useEffect(() => {
    fetchAdminReports().then((data) => {
      console.log("📊 ADMIN REPORT:", data);
      setReport(data);
    });
  }, []);

  if (!report) return <p>⏳ Đang tải báo cáo...</p>;

  // ====================== FIX QUAN TRỌNG ======================
  const pie = report?.pieCounts || { student: 0, guest: 0, remaining: 0 };
  const student = pie.student || 0;
  const guest = pie.guest || 0;
  const remaining = pie.remaining || 0;

  const ratings = report?.ratingDistribution || [];
  const revenue = report?.revenueByMonth || [];
  // =============================================================

  return (
    <div style={{ padding: "20px" }}>
      <h2 className="fw-bold mb-4">📊 Báo cáo tổng hệ thống</h2>

      {/* ================== SUMMARY CARDS ================== */}
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
          value={(report.totalRevenue || 0).toLocaleString("vi-VN") + " đ"}
          color="#ff7a18"
        />
      </div>

      {/* ================== PIE CHART ================== */}
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

      {/* ================== RATING BAR ================== */}
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

      {/* ================== REVENUE LINE ================== */}
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
    </div>
  );
}

/* ==========================================
   SUMMARY CARD COMPONENT
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
