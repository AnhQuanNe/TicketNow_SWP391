import React, { useEffect, useState } from "react";
import StatsCard from "./StatsCard";
import "../css/Dashboard.css";
//js
function Dashboard() {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard/stats");
        const data = await res.json();

        const statsArray = [
          { title: "Tổng sự kiện", value: data.totalEvents },
          { title: "Vé đã bán", value: data.ticketsSold },
          { title: "Doanh thu", value: data.revenue.toLocaleString("vi-VN") + " ₫" },
        ];

        setStats(statsArray);
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard">
      <h2>Tổng quan</h2>

      {stats.length === 0 ? (
        <div className="no-events">Không có dữ liệu thống kê</div>
      ) : (
        <div className="stats-container">
          {stats.map((s, i) => (
            <StatsCard key={i} title={s.title} value={s.value} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
