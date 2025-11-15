import React, { useEffect, useState } from "react";

function TicketsRevenue() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    // placeholder API call: cần endpoint trả doanh thu theo event và dữ liệu theo thời gian
    const fetchStats = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/organizer/revenue");
        const data = await res.json();
        setStats(data || {});
      } catch (e) {
        console.error("Lỗi khi lấy doanh thu", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="tickets-revenue">
      <h2>Tickets & Revenue</h2>
      <p>Danh sách sự kiện và tổng doanh thu theo event (placeholder)</p>

      <div>
        <pre>{JSON.stringify(stats, null, 2)}</pre>
      </div>

      <div className="chart-placeholder">Biểu đồ vé bán ra theo thời gian (sẽ làm sau khi có dữ liệu)</div>
    </div>
  );
}

export default TicketsRevenue;
