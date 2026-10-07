// front-end/src/admin/js/Reports.js
import React, { useEffect, useState } from "react";
import { fetchAdminReports, fetchEventReport } from "../api/reportApi";
import { adminFetchEvents } from "../api/eventAdminApi";
import "../css/Reports.css";

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
  Filler,
} from "chart.js";

import { Pie, Bar, Line } from "react-chartjs-2";
import { FaFilePdf, FaCalendarAlt, FaArrowLeft, FaChartBar, FaTicketAlt, FaStar, FaMoneyBillWave } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler
);

export default function Reports() {
  const [report, setReport] = useState(null);
  const [showEventList, setShowEventList] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventReport, setEventReport] = useState(null);

  // Load Report Tổng
  useEffect(() => {
    fetchAdminReports().then((data) => {
      setReport(data);
    });
  }, []);

  // Load danh sách sự kiện khi bật chế độ xem sự kiện
  useEffect(() => {
    if (showEventList) {
      adminFetchEvents().then((data) => {
        setEvents(data.events || []);
      });
    }
  }, [showEventList]);

  // Load Report theo sự kiện
  const loadEventReport = async (eventId) => {
    const data = await fetchEventReport(eventId);
    setSelectedEvent(eventId);
    setEventReport(data);
  };

  // Function xuất PDF
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

  if (!report) {
    return (
      <div className="report-page-container">
        <div style={{ textAlign: "center", padding: "60px 0", color: "#64748b" }}>
          <p>⏳ Đang tổng hợp dữ liệu báo cáo hệ thống...</p>
        </div>
      </div>
    );
  }

  const pie = report?.pieCounts || { student: 0, guest: 0, remaining: 0 };
  const student = pie.student || 0;
  const guest = pie.guest || 0;
  const remaining = pie.remaining || 0;

  const ratings = report?.ratingDistribution || [];
  const revenue = report?.revenueByMonth || [];

  return (
    <div className="report-page-container" id="report-content">
      {/* Header & Toolbar */}
      <div className="report-toolbar">
        <div className="report-toolbar-title">
          <FaChartBar style={{ color: "#ff7a18" }} />
          <span>Báo Cáo & Thống Kê Toàn Hệ Thống</span>
        </div>

        <div className="report-btn-group">
          <button onClick={exportPDF} className="btn-pdf">
            <FaFilePdf /> Xuất PDF
          </button>

          <button
            onClick={() => {
              setShowEventList(!showEventList);
              setSelectedEvent(null);
              setEventReport(null);
            }}
            className={`btn-switch-mode ${showEventList ? "" : "mode-event"}`}
          >
            {showEventList ? (
              <>
                <FaArrowLeft /> Báo cáo tổng
              </>
            ) : (
              <>
                <FaCalendarAlt /> Báo cáo theo sự kiện
              </>
            )}
          </button>
        </div>
      </div>

      {/* DANH SÁCH SỰ KIỆN */}
      {showEventList && !selectedEvent && (
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: "#0f172a" }}>
            📅 Chọn sự kiện để xem báo cáo chi tiết:
          </h3>

          <div className="event-selection-grid">
            {events.map((ev) => (
              <div
                key={ev._id}
                onClick={() => loadEventReport(ev._id)}
                className="event-select-card"
              >
                <h4>{ev.title}</h4>
                <p>
                  <FaCalendarAlt /> {new Date(ev.date).toLocaleDateString("vi-VN")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BÁO CÁO CHI TIẾT SỰ KIỆN */}
      {selectedEvent && eventReport && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              📈 Báo cáo sự kiện: {eventReport.title}
            </h3>
            <button
              onClick={() => {
                setSelectedEvent(null);
                setEventReport(null);
              }}
              style={{
                padding: "8px 14px",
                background: "#f1f5f9",
                color: "#334155",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              ⬅️ Chọn sự kiện khác
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="summary-container">
            <SummaryCard
              title="Tổng đơn hàng"
              value={eventReport.totalOrders || 0}
              color="#3b82f6"
            />
            <SummaryCard
              title="Vé đã bán"
              value={(eventReport.pieCounts.student || 0) + (eventReport.pieCounts.guest || 0)}
              color="#10b981"
            />
            <SummaryCard
              title="Doanh thu sự kiện"
              value={(eventReport.totalRevenue || 0).toLocaleString("vi-VN") + " đ"}
              color="#ff7a18"
            />
          </div>

          {/* CHARTS */}
          <div className="charts-dual-grid">
            <div className="chart-box">
              <div className="chart-box-header">
                <h4><FaTicketAlt style={{ color: "#3b82f6" }} /> Tỷ lệ loại vé</h4>
                <div className="chart-box-subtitle">Cơ cấu số vé phát hành</div>
              </div>
              <Pie
                data={{
                  labels: [
                    `Sinh viên (${eventReport.pieCounts.student})`,
                    `Khách mời (${eventReport.pieCounts.guest})`,
                    `Còn lại (${eventReport.pieCounts.remaining})`,
                  ],
                  datasets: [
                    {
                      data: [
                        eventReport.pieCounts.student,
                        eventReport.pieCounts.guest,
                        eventReport.pieCounts.remaining,
                      ],
                      backgroundColor: ["#3b82f6", "#ff7a18", "#cbd5e1"],
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: "bottom" } },
                }}
              />
            </div>

            <div className="chart-box">
              <div className="chart-box-header">
                <h4><FaStar style={{ color: "#eab308" }} /> Phân loại đánh giá</h4>
                <div className="chart-box-subtitle">Mức độ hài lòng của người tham gia</div>
              </div>
              <Bar
                data={{
                  labels: eventReport.ratingDistribution.map((r) => `${r.rating} ⭐`),
                  datasets: [
                    {
                      label: "Số lượt đánh giá",
                      data: eventReport.ratingDistribution.map((r) => r.count),
                      backgroundColor: "#10b981",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* BÁO CÁO TỔNG QUAN */}
      {!showEventList && (
        <>
          {/* SUMMARY CARDS */}
          <div className="summary-container">
            <SummaryCard
              title="Tổng sự kiện"
              value={report.totalEvents || 0}
              color="#3b82f6"
            />
            <SummaryCard
              title="Tổng đơn đặt"
              value={report.totalOrders || 0}
              color="#10b981"
            />
            <SummaryCard
              title="Doanh thu vé"
              value={(report.ticketRevenue || 0).toLocaleString("vi-VN") + " đ"}
              color="#0284c7"
            />
            <SummaryCard
              title="Doanh thu quảng bá"
              value={(report.promotionRevenue || 0).toLocaleString("vi-VN") + " đ"}
              color="#059669"
            />
            <SummaryCard
              title="Tổng doanh thu"
              value={(report.totalRevenue || 0).toLocaleString("vi-VN") + " đ"}
              color="#ff7a18"
            />
          </div>

          {/* DUAL CHARTS */}
          <div className="charts-dual-grid">
            <div className="chart-box">
              <div className="chart-box-header">
                <h4><FaTicketAlt style={{ color: "#3b82f6" }} /> Tỷ lệ cơ cấu vé</h4>
                <div className="chart-box-subtitle">Phân bố trên toàn bộ các sự kiện</div>
              </div>
              <div style={{ height: 260 }}>
                <Pie
                  data={{
                    labels: [
                      `Sinh viên (${student})`,
                      `Khách mời (${guest})`,
                      `Còn lại (${remaining})`,
                    ],
                    datasets: [
                      {
                        data: [student, guest, remaining],
                        backgroundColor: ["#3b82f6", "#ff7a18", "#cbd5e1"],
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: "bottom" } },
                  }}
                />
              </div>
            </div>

            <div className="chart-box">
              <div className="chart-box-header">
                <h4><FaStar style={{ color: "#eab308" }} /> Phân loại đánh giá</h4>
                <div className="chart-box-subtitle">Thống kê xếp hạng sao từ khán giả</div>
              </div>
              <div style={{ height: 260 }}>
                <Bar
                  data={{
                    labels: ratings.map((r) => `${r.rating} ⭐`),
                    datasets: [
                      {
                        label: "Số lượng đánh giá",
                        data: ratings.map((r) => r.count),
                        backgroundColor: "#10b981",
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                  }}
                />
              </div>
            </div>
          </div>

          {/* MONTHLY REVENUE CHART */}
          <div className="chart-box">
            <div className="chart-box-header">
              <h4><FaMoneyBillWave style={{ color: "#ff7a18" }} /> Tăng trưởng doanh thu theo tháng</h4>
              <div className="chart-box-subtitle">Dòng tiền bán vé và quảng bá thực thu</div>
            </div>
            <div style={{ height: 320 }}>
              <Line
                data={{
                  labels: revenue.map((m) => m.monthLabel),
                  datasets: [
                    {
                      label: "Doanh thu (VND)",
                      data: revenue.map((m) => m.total),
                      borderColor: "#ff7a18",
                      backgroundColor: "rgba(255, 122, 24, 0.12)",
                      fill: true,
                      tension: 0.35,
                      borderWidth: 3,
                      pointBackgroundColor: "#ff7a18",
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      callbacks: {
                        label: (ctx) => ` Doanh thu: ${Number(ctx.raw).toLocaleString("vi-VN")} đ`,
                      },
                    },
                  },
                  scales: {
                    x: { grid: { display: false } },
                    y: {
                      beginAtZero: true,
                      grid: { color: "#f1f5f9" },
                      ticks: {
                        callback: (val) => `${(val / 1000000).toFixed(1)}M đ`,
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className="summary-card" style={{ "--color": color }}>
      <div className="summary-top-bar" style={{ background: color }}></div>
      <div className="summary-title">{title}</div>
      <div className="summary-value" style={{ color }}>{value}</div>
    </div>
  );
}
