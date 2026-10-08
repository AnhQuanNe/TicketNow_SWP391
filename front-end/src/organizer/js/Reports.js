import React, { useEffect, useState } from "react";
import {
  MdOutlineFestival,
  MdConfirmationNumber,
  MdAttachMoney,
  MdPeopleOutline,
  MdTrendingUp,
  MdStarOutline,
} from "react-icons/md";
import { FaCrown, FaTicketAlt, FaChartLine } from "react-icons/fa";
import { API_BASE_URL } from "../../config.js";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import "../css/Reports.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Reports() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("organizerToken") ||
          localStorage.getItem("adminToken");
        const res = await fetch(`${API_BASE_URL}/api/organizer/reports`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("Không thể tải dữ liệu báo cáo");
        const data = await res.json();
        setReport(data);
      } catch (e) {
        console.error("Lỗi khi lấy reports:", e);
        setError(e.message || "Lỗi khi lấy reports");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="organizer-reports">
        <div className="reports-loading">
          <div className="reports-spinner"></div>
          <h4>Đang đồng bộ dữ liệu báo cáo thời gian thực...</h4>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="organizer-reports">
        <div className="reports-empty">
          <p style={{ color: "#ef4444", fontSize: 16 }}>❌ {error}</p>
          <button
            className="kpi-tag"
            onClick={() => window.location.reload()}
            style={{ cursor: "pointer", marginTop: 12 }}
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const pie = report?.pieCounts || {};
  const student = pie.student || 0;
  const guest = pie.guest || 0;
  const remaining = pie.remaining || report?.ticketsRemainingTotal || 0;
  const totalTickets = student + guest + remaining;

  const monthLabels = (report?.revenueByMonth || []).map(
    (r) => `${r.monthLabel} ${r.year}`
  );
  const monthData = (report?.revenueByMonth || []).map((r) => r.total || 0);

  const ratingData = report?.ratingDistribution || [
    { rating: 1, count: 0 },
    { rating: 2, count: 0 },
    { rating: 3, count: 0 },
    { rating: 4, count: 0 },
    { rating: 5, count: 0 },
  ];

  return (
    <div className="organizer-reports">
      {/* Header */}
      <div className="reports-header">
        <div className="reports-header-left">
          <h2>
            <MdTrendingUp style={{ color: "#ff7a18" }} /> Báo Cáo & Thống Kê
          </h2>
          <p>
            Theo dõi tổng hợp doanh thu, lượng vé đã bán và phân loại phản hồi sự kiện
          </p>
        </div>
        <div className="reports-badge-live">
          <span className="live-dot"></span>
          Cập nhật tự động
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="reports-kpi-grid">
        {/* KPI 1: Doanh thu */}
        <div className="kpi-card">
          <div className="kpi-card-glow glow-orange"></div>
          <div className="kpi-top">
            <div className="kpi-icon-box icon-box-orange">
              <MdAttachMoney />
            </div>
            <span className="kpi-tag">VND</span>
          </div>
          <div className="kpi-title">Tổng Doanh Thu</div>
          <div className="kpi-value" style={{ color: "#ff914d" }}>
            {Number(report?.totalRevenue || 0).toLocaleString("vi-VN")} đ
          </div>
          <div className="kpi-subtext">
            <span>Từ tất cả các đơn hàng thành công</span>
          </div>
        </div>

        {/* KPI 2: Vé đã bán */}
        <div className="kpi-card">
          <div className="kpi-card-glow glow-blue"></div>
          <div className="kpi-top">
            <div className="kpi-icon-box icon-box-blue">
              <MdConfirmationNumber />
            </div>
            <span className="kpi-tag">Vé</span>
          </div>
          <div className="kpi-title">Vé Đã Bán</div>
          <div className="kpi-value">
            {Number(report?.ticketsSold || 0).toLocaleString()}
          </div>
          <div className="kpi-subtext">
            <span>Còn lại: {Number(remaining).toLocaleString()} vé</span>
          </div>
        </div>

        {/* KPI 3: Tổng đơn hàng */}
        <div className="kpi-card">
          <div className="kpi-card-glow glow-green"></div>
          <div className="kpi-top">
            <div className="kpi-icon-box icon-box-green">
              <MdPeopleOutline />
            </div>
            <span className="kpi-tag">Đơn</span>
          </div>
          <div className="kpi-title">Tổng Đơn Hàng</div>
          <div className="kpi-value">
            {Number(report?.totalOrders || 0).toLocaleString()}
          </div>
          <div className="kpi-subtext">
            <span>Khách hàng độc nhất: {report?.uniqueBuyers || 0}</span>
          </div>
        </div>

        {/* KPI 4: Tổng sự kiện */}
        <div className="kpi-card">
          <div className="kpi-card-glow glow-purple"></div>
          <div className="kpi-top">
            <div className="kpi-icon-box icon-box-purple">
              <MdOutlineFestival />
            </div>
            <span className="kpi-tag">Events</span>
          </div>
          <div className="kpi-title">Sự Kiện Của Bạn</div>
          <div className="kpi-value">
            {Number(report?.totalEvents || 0).toLocaleString()}
          </div>
          <div className="kpi-subtext">
            <span>Đang phát hành và quản lý</span>
          </div>
        </div>
      </div>

      {/* Middle Row Charts */}
      <div className="reports-charts-grid">
        {/* Rating Breakdown */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>
                <MdStarOutline style={{ color: "#eab308" }} /> Phân Loại Đánh Giá
              </h3>
              <div className="chart-card-subtitle">
                Mức độ hài lòng từ 1 đến 5 sao của khán giả
              </div>
            </div>
          </div>
          <div className="chart-container-medium">
            <Bar
              data={{
                labels: ratingData.map((r) => `${r.rating} ⭐`),
                datasets: [
                  {
                    label: "Số lượt đánh giá",
                    data: ratingData.map((r) => r.count),
                    backgroundColor: [
                      "#ef4444",
                      "#f97316",
                      "#eab308",
                      "#3b82f6",
                      "#10b981",
                    ],
                    borderRadius: 8,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: "#1e293b",
                    titleColor: "#ffffff",
                    bodyColor: "#94a3b8",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8" },
                  },
                  y: {
                    beginAtZero: true,
                    grid: { color: "rgba(255,255,255,0.06)" },
                    ticks: { color: "#94a3b8", stepSize: 1 },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Ticket Type Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <div>
              <h3>
                <FaTicketAlt style={{ color: "#38bdf8" }} /> Tỷ Lệ Cơ Cấu Vé
              </h3>
              <div className="chart-card-subtitle">
                Phân bố vé Sinh viên, Khách mời và Vé còn trống
              </div>
            </div>
          </div>
          <div className="chart-container-medium">
            <Doughnut
              data={{
                labels: [
                  `Sinh viên (${student})`,
                  `Khách mời (${guest})`,
                  `Còn lại (${remaining})`,
                ],
                datasets: [
                  {
                    data: [student, guest, remaining],
                    backgroundColor: ["#ff7a18", "#38bdf8", "#475569"],
                    borderColor: "#0f172a",
                    borderWidth: 3,
                    hoverOffset: 6,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      color: "#94a3b8",
                      boxWidth: 12,
                      padding: 14,
                      font: { size: 12, weight: "600" },
                    },
                  },
                  tooltip: {
                    backgroundColor: "#1e293b",
                    titleColor: "#ffffff",
                    bodyColor: "#94a3b8",
                    borderColor: "rgba(255,255,255,0.1)",
                    borderWidth: 1,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Large Monthly Revenue Chart */}
      <div className="chart-card" style={{ marginBottom: 28 }}>
        <div className="chart-card-header">
          <div>
            <h3>
              <FaChartLine style={{ color: "#10b981" }} /> Doanh Thu Tích Lũy Theo Tháng
            </h3>
            <div className="chart-card-subtitle">
              Xu hướng tăng trưởng dòng tiền qua các tháng
            </div>
          </div>
        </div>
        <div className="chart-container-large">
          <Line
            data={{
              labels:
                monthLabels.length > 0 ? monthLabels : ["Chưa có dữ liệu"],
              datasets: [
                {
                  label: "Doanh thu (VND)",
                  data: monthData.length > 0 ? monthData : [0],
                  borderColor: "#10b981",
                  backgroundColor: "rgba(16, 185, 129, 0.12)",
                  borderWidth: 3,
                  pointBackgroundColor: "#10b981",
                  pointBorderColor: "#ffffff",
                  pointHoverRadius: 6,
                  fill: true,
                  tension: 0.35,
                },
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: "#1e293b",
                  titleColor: "#ffffff",
                  bodyColor: "#94a3b8",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: 1,
                  callbacks: {
                    label: (context) =>
                      ` Doanh thu: ${Number(context.raw).toLocaleString("vi-VN")} đ`,
                  },
                },
              },
              scales: {
                x: {
                  grid: { color: "rgba(255,255,255,0.04)" },
                  ticks: { color: "#94a3b8" },
                },
                y: {
                  beginAtZero: true,
                  grid: { color: "rgba(255,255,255,0.06)" },
                  ticks: {
                    color: "#94a3b8",
                    callback: (value) =>
                      `${(value / 1000000).toFixed(1)}M đ`,
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Top Events Table */}
      {report?.topEvents && report.topEvents.length > 0 && (
        <div className="top-events-card">
          <div className="top-events-card-header">
            <h3>
              <FaCrown style={{ color: "#f59e0b" }} /> Sự Kiện Doanh Thu Hàng Đầu
            </h3>
          </div>
          <div className="top-events-table-wrapper">
            <table className="top-events-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>#</th>
                  <th>Tên Sự Kiện</th>
                  <th>Ngày Tổ Chức</th>
                  <th>Vé Đã Bán</th>
                  <th style={{ textAlign: "right" }}>Doanh Thu</th>
                </tr>
              </thead>
              <tbody>
                {report.topEvents.map((ev, idx) => (
                  <tr key={ev.eventId || idx}>
                    <td>
                      <span
                        className={`rank-badge ${
                          idx === 0
                            ? "rank-1"
                            : idx === 1
                            ? "rank-2"
                            : idx === 2
                            ? "rank-3"
                            : "rank-other"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <div className="event-cell-title">{ev.title || "—"}</div>
                    </td>
                    <td>
                      <div className="event-cell-date">
                        {ev.date
                          ? new Date(ev.date).toLocaleDateString("vi-VN")
                          : "—"}
                      </div>
                    </td>
                    <td>
                      <span className="sold-pill">
                        <FaTicketAlt /> {ev.ticketsSold || 0} vé
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className="revenue-highlight">
                        {Number(ev.totalRevenue || 0).toLocaleString("vi-VN")} đ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
