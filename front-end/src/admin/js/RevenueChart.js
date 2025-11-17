import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RevenueChart({ revenue }) {
  // revenue = revenueByMonth từ API
  const labels = revenue?.map((m) => m.monthLabel) || [];
  const values = revenue?.map((m) => m.total) || [];

  const chartData = {
    labels,
    datasets: [
      {
        label: "Doanh thu theo tháng (VND)",
        data: values,
        borderColor: "#4ECDC4",
        backgroundColor: "rgba(78,205,196,0.25)",
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointBackgroundColor: "white",
        pointBorderColor: "#4ECDC4",
        pointBorderWidth: 2,
        pointHoverRadius: 8
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "white",
        titleColor: "#2c3e50",
        bodyColor: "#7f8c8d",
        borderColor: "#e0e0e0",
        borderWidth: 1,
        padding: 12,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#95a5a6" },
        grid: { color: "#f0f0f0", drawBorder: false }
      },
      x: {
        ticks: { color: "#95a5a6" },
        grid: { display: false }
      }
    },
    interaction: {
      intersect: false,
      mode: "index"
    }
  };

  return (
    <div className="revenue-section">
      <div className="section-header">
        <h3 className="section-title">📈 Doanh thu theo tháng</h3>
      </div>
      <div style={{ height: "350px", position: "relative" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
