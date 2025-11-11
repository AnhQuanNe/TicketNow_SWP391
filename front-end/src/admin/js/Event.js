import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

export default function Event() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, completed

  useEffect(() => {
    fetch("http://localhost:5000/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setEvents(mockEvents);
        setLoading(false);
      });
  }, []);

  const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return "0đ";
  return Number(amount).toLocaleString("vi-VN") + "đ";
};


  const getStatusBadge = (status) => {
    const badges = {
      'active': <span className="badge success">Đang bán</span>,
      'completed': <span className="badge info">Đã hoàn thành</span>,
      'cancelled': <span className="badge danger">Đã hủy</span>
    };
    return badges[status] || null;
  };

  const getProgress = (sold, total) => {
    const percentage = (sold / total * 100).toFixed(1);
    return (
      <div style={{ width: '120px' }}>
        <div style={{ 
          background: '#e0e0e0', 
          height: '8px', 
          borderRadius: '4px', 
          overflow: 'hidden',
          marginBottom: '4px'
        }}>
          <div style={{ 
            background: percentage >= 80 ? '#4ECDC4' : '#FF8C42', 
            height: '100%', 
            width: `${percentage}%`,
            transition: 'width 0.3s'
          }}></div>
        </div>
        <small style={{ color: '#7f8c8d', fontSize: '12px' }}>
          {sold}/{total} ({percentage}%)
        </small>
      </div>
    );
  };

  const exportToExcel = () => {
    if (events.length === 0) {
      alert("Chưa có dữ liệu để xuất!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      events.map((e) => ({
        "ID": e._id || e.id,
        "Tên sự kiện": e.name,
        "Ngày": e.date,
        "Địa điểm": e.location,
        "Vé đã bán": e.ticketsSold,
        "Tổng vé": e.totalTickets,
        "Giá vé": e.price,
        "Trạng thái": e.status,
        "Doanh thu": e.ticketsSold * e.price
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Events");
    XLSX.writeFile(workbook, "DanhSachSuKien.xlsx");
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.status === filter;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="event-page">
      <div className="page-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px' 
      }}>
        <div>
          <h2>Quản lý Sự kiện</h2>
          <p style={{ color: '#7f8c8d', marginTop: '8px' }}>
            Tổng số: {events.length} sự kiện
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn-secondary"
            onClick={exportToExcel}
            style={{
              padding: '12px 24px',
              background: '#ecf0f1',
              color: '#2c3e50',
              border: 'none',
              borderRadius: '10px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            📥 Xuất Excel
          </button>
          <button 
            className="btn-primary"
            onClick={() => alert('Tạo sự kiện mới')}
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
            + Tạo sự kiện
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        {['all', 'active', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px',
              background: filter === f ? '#FF8C42' : 'white',
              color: filter === f ? 'white' : '#7f8c8d',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {f === 'all' ? 'Tất cả' : f === 'active' ? 'Đang bán' : 'Đã hoàn thành'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên sự kiện</th>
                <th>Ngày</th>
                <th>Địa điểm</th>
                <th>Tiến độ</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                    Không có sự kiện nào
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event._id || event.id}>
                    <td>{event._id || event.id}</td>
                    <td><strong>{event.name}</strong></td>
                    <td>{new Date(event.date).toLocaleDateString('vi-VN')}</td>
                    <td>{event.location}</td>
                    <td>{getProgress(event.ticketsSold, event.totalTickets)}</td>
                    <td>{event.price ? formatCurrency(event.price) : "—"}</td>
                    <td>{getStatusBadge(event.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-icon"
                          title="Xem chi tiết"
                          style={{
                            padding: '6px 10px',
                            background: '#ecf0f1',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          👁️
                        </button>
                        <button 
                          className="btn-icon"
                          title="Chỉnh sửa"
                          style={{
                            padding: '6px 10px',
                            background: '#ecf0f1',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon"
                          title="Thống kê"
                          style={{
                            padding: '6px 10px',
                            background: '#ecf0f1',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          📊
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const mockEvents = [
  {
    id: 1,
    name: 'Đại nhạc hội Rock Việt 2024',
    date: '2024-12-15',
    location: 'Sân vận động Mỹ Đình',
    ticketsSold: 1250,
    totalTickets: 2000,
    price: 500000,
    status: 'active'
  },
  {
    id: 2,
    name: 'Hội thảo Công nghệ AI',
    date: '2024-11-20',
    location: 'Trung tâm Hội nghị Quốc gia',
    ticketsSold: 450,
    totalTickets: 500,
    price: 300000,
    status: 'active'
  },
  {
    id: 3,
    name: 'Triển lãm Nghệ thuật Đương đại',
    date: '2024-10-30',
    location: 'Bảo tàng Mỹ thuật',
    ticketsSold: 800,
    totalTickets: 800,
    price: 150000,
    status: 'completed'
  }
];