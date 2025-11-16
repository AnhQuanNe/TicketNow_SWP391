import React, { useEffect, useState } from "react";
import { MdOutlineFestival } from "react-icons/md";
import { AiTwotoneTags } from "react-icons/ai";
import { IoReceiptSharp } from "react-icons/io5";
import { FaRegStar } from "react-icons/fa6";

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

export default function Reports() {
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch("http://localhost:5000/api/organizer/reports", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('Không thể lấy reports');
        const data = await res.json();
        setReport(data);
      } catch (e) {
        console.error("Lỗi khi lấy reports", e);
        setError(e.message || 'Lỗi khi lấy reports');
      }
    };
    fetchReport();
  }, []);

  if (error) return <div className="reports"><h2>Reports</h2><p style={{color:'red'}}>{error}</p></div>;
  if (!report) return <div className="reports"><h2>Reports</h2><p>Đang tải...</p></div>;

  // small helpers
  const COLOR_ORANGE = '#ff7a18';
  const COLOR_BLUE = '#4f86ff';
  const COLOR_GREEN = '#10b981';
  const COLOR_GRAY ='#7d7d7dff';

  return (
    <div className="reports">
      <h2 className="text-center fw-bold mb-5">Overview</h2>

      <div style={{display:'flex',gap:12,marginTop:12}}>
        <div className="stat-card">
          <div className="stat-icon icon-orange"><MdOutlineFestival/></div>
          <div className="stat-content text-end">
            <div className="stat-title">Tổng sự kiện</div>
            <div className="stat-value">{(report.totalEvents||0).toLocaleString()}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-blue"><AiTwotoneTags/></div>
          <div className="stat-content text-end">
            <div className="stat-title">Tổng doanh thu</div>
            <div className="stat-value">{Number(report.totalRevenue||0).toLocaleString(undefined,{style:'currency',currency:'VND',maximumFractionDigits:0})}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-green"><IoReceiptSharp/></div>
          <div className="stat-content text-end">
            <div className="stat-title">Tổng đơn</div>
            <div className="stat-value">{(report.totalOrders||0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:18}}>
        <div className="stat-card">
          <h4 className="fw-bold" style={{margin:0,marginBottom:15}}>Phân Loại Đánh Giá</h4>
          <div className="chart-medium">
            <Bar data={{ labels: report.ratingDistribution.map(r=>String(r.rating) ), datasets:[{ label:'Số đánh giá', data: report.ratingDistribution.map(r=>r.count), backgroundColor: COLOR_GREEN }] }} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }} />
          </div>
        </div>

        <div className="stat-card">
          <h4 className="fw-bold" style={{margin:0,marginBottom:15}}>Tỷ Lệ Vé Bán</h4>
          <div className="chart-medium">
            {
              (() => {
                // prefer pieCounts (student, guest, remaining) returned by backend
                const pie = report.pieCounts || {};
                const student = pie.student || 0;
                const guest = pie.guest || 0;
                const remaining = pie.remaining || report.ticketsRemainingTotal || 0;
                const labels = [`Student (${student})`, `Guest (${guest})`, `Remaining (${remaining})`];
                const data = [student, guest, remaining];
                const colors = [COLOR_ORANGE, COLOR_BLUE,COLOR_GRAY];
                return <Pie data={{ labels, datasets:[{ data, backgroundColor: colors }] }} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom' } } }} />
              })()
            }
          </div>
        </div>
      </div>

      <div className="stat-card" style={{marginTop:16}}>
        <h4 className='fw-bold ' style={{margin:0,marginBottom:15}}>Doanh Thu Tích Lũy Theo Tháng</h4>
        <div className="chart-large">
          <Line data={{ labels: (report.revenueByMonth||[]).map(r=>r.monthLabel + ' ' + r.year), datasets:[{ label:'Doanh thu', data:(report.revenueByMonth||[]).map(r=>r.total), borderColor: COLOR_BLUE, backgroundColor:'rgba(79,134,255,0.12)', fill:true }] }} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }} />
        </div>
      </div>

      
      </div>
  );
}
