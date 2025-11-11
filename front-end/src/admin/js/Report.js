import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function Report() {
  const [reportData, setReportData] = useState({
    summary: {
      totalRevenue: 0,
      totalTickets: 0,
      totalEvents: 0,
      avgTicketPrice: 0
    },
    topEvents: [],
    monthlyRevenue: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // month, quarter, year

  // Dữ liệu ảo để test chart trước khi API sẵn sàng
  const fakeData = {
    summary: {
      totalRevenue: 125000000,
      totalTickets: 3250,
      totalEvents: 15,
      avgTicketPrice: 384615
    },
    topEvents: [
      { name: 'Đại nhạc hội Rock Việt', revenue: 45000000, tickets: 900 },
      { name: 'Hội thảo Công nghệ AI', revenue: 35000000, tickets: 700 },
      { name: 'Triển lãm Nghệ thuật', revenue: 25000000, tickets: 500 }
    ],
    monthlyRevenue: [
      { month: 'T1', revenue: 8000000 },
      { month: 'T2', revenue: 12000000 },
      { month: 'T3', revenue: 15000000 },
      { month: 'T4', revenue: 11000000 },
      { month: 'T5', revenue: 18000000 },
      { month: 'T6', revenue: 20000000 }
    ]
  };

  useEffect(() => {
    // Fake fetch API, dùng dữ liệu test nếu server chưa sẵn sàng
    fetch(`http://localhost:5000/api/reports?period=${period}`)
      .then(res => {
        if (!res.ok) throw new Error('Server not ready');
        return res.json();
      })
      .then(data => {
        setReportData(data);
        setLoading(false);
      })
      .catch(err => {
        console.warn('API chưa sẵn sàng, dùng dữ liệu test', err);
        setReportData(fakeData);
        setLoading(false);
      });
  }, [period]);

  const formatCurrency = (amount) => {
    return amount.toLocaleString('vi-VN') + 'đ';
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['BÁO CÁO TỔNG QUAN'],
      [''],
      ['Tổng doanh thu', reportData.summary.totalRevenue],
      ['Tổng vé bán', reportData.summary.totalTickets],
      ['Tổng sự kiện', reportData.summary.totalEvents],
      ['Giá vé trung bình', reportData.summary.avgTicketPrice]
    ];
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tổng quan');

    // Top Events Sheet
    const eventsData = [
      ['SỰ KIỆN DOANH THU CAO NHẤT'],
      ['Tên sự kiện', 'Doanh thu', 'Số vé bán'],
      ...reportData.topEvents.map(e => [e.name, e.revenue, e.tickets])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(eventsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Top sự kiện');

    // Monthly Revenue Sheet
    const monthlyData = [
      ['DOANH THU THEO THÁNG'],
      ['Tháng', 'Doanh thu'],
      ...reportData.monthlyRevenue.map(m => [m.month, m.revenue])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Theo tháng');
XLSX.writeFile(wb, `BaoCao_${new Date().toLocaleDateString('vi-VN')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="report-page">
      {/* Header */}
      <div 
        className="page-header"
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px'
        }}
      >
        <div>
          <h2>Báo cáo & Thống kê</h2>
          <p style={{ color: '#7f8c8d', marginTop: '8px' }}>
            Tổng quan về doanh thu và hoạt động
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{
              padding: '12px 20px',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              background: 'white',
              color: '#2c3e50',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <option value="month">Tháng này</option>
            <option value="quarter">Quý này</option>
            <option value="year">Năm này</option>
          </select>
          <button 
            onClick={exportToExcel}
            style={{
              padding: '12px 24px',
              background: '#FF8C42',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📥 Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid">
        {[
          { icon: '💰', label: 'Tổng doanh thu', value: formatCurrency(reportData.summary.totalRevenue), color: '#4ECDC4' },
          { icon: '🎫', label: 'Tổng vé bán', value: reportData.summary.totalTickets.toLocaleString(), color: '#45B7D1' },
          { icon: '📊', label: 'Tổng sự kiện', value: reportData.summary.totalEvents, color: '#FF6B6B' }
        ].map((item, idx) => (
          <div key={idx} className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px'
              }}>
                {item.icon}
              </div>
              <div>
                <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '4px' }}>
                  {item.label}
                </p>
<h3 style={{ fontSize: '24px', fontWeight: 700, color: '#2c3e50', margin: 0 }}>
                  {item.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Top Events */}
      <div className="card" style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Sự kiện doanh thu cao nhất</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên sự kiện</th>
                <th>Doanh thu</th>
                <th>Số vé bán</th>
                <th>Biểu đồ</th>
              </tr>
            </thead>
            <tbody>
              {reportData.topEvents.map((event, idx) => {
                const maxRevenue = Math.max(...reportData.topEvents.map(e => e.revenue));
                const percentage = (event.revenue / maxRevenue * 100);
                return (
                  <tr key={idx}>
                    <td><strong>{event.name}</strong></td>
                    <td>{formatCurrency(event.revenue)}</td>
                    <td>{event.tickets.toLocaleString()}</td>
                    <td>
                      <div style={{ 
                        width: '200px', 
                        background: '#e0e0e0', 
                        height: '8px', 
                        borderRadius: '4px', 
                        overflow: 'hidden' 
                      }}>
                        <div style={{ 
                          background: 'linear-gradient(90deg, #4ECDC4, #45B7D1)', 
                          height: '100%', 
                          width: `${percentage}%`,
                          transition: 'width 0.5s'
                        }}></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card" style={{ marginTop: '30px' }}>
        <h3 style={{ marginBottom: '20px' }}>Doanh thu theo tháng</h3>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', height: '250px' }}>
          {reportData.monthlyRevenue.map((data, idx) => {
            const maxRevenue = Math.max(...reportData.monthlyRevenue.map(d => d.revenue));
            const height = (data.revenue / maxRevenue * 200);
            return (
              <div 
                key={idx}
                style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#2c3e50' }}>
                  {(data.revenue / 1000000).toFixed(1)}M
                </span>
                <div style={{ 
                  width: '100%',
height: `${height}px`, 
                  background: 'linear-gradient(180deg, #4ECDC4, #45B7D1)', 
                  borderRadius: '8px 8px 0 0',
                  transition: 'height 0.5s',
                  cursor: 'pointer'
                }}
                  title={formatCurrency(data.revenue)}
                ></div>
                <span style={{ fontSize: '13px', color: '#7f8c8d', fontWeight: 500 }}>
                  {data.month}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}