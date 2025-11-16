import React, { useState, useEffect } from 'react';
import { updateEventStatus } from '../../api/organizerApi'; // Import API cập nhật trạng thái sự kiện

export default function Notification() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
  const token = localStorage.getItem('token');  // Đảm bảo bạn đã đăng nhập và có token
  if (!token) {
    setMessage("⚠️ Bạn cần đăng nhập trước khi xem các sự kiện.");
    return;
  }

  fetch(`${process.env.REACT_APP_API_URL}/event-requests`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
    .then(res => res.json())
.then(data => {
  if (Array.isArray(data)) {
    setEvents(data);   // ✔️ sửa tại đây
  } else {
    setMessage("Không có sự kiện chờ duyệt.");
  }
  setLoading(false); // ✔️ thêm dòng này
})

    .catch(err => {
      console.error("Lỗi khi lấy sự kiện:", err);
      setMessage("❌ Lỗi khi lấy sự kiện chờ duyệt.");
      setLoading(false);   // ✔️ thêm dòng này
    });
}, []);



const handleApprove = (eventId) => {
  console.log("Duyệt sự kiện với ID: ", eventId);  // Debug log

  updateEventStatus(eventId, 'approved').then((response) => {
    console.log("Phản hồi từ API duyệt sự kiện: ", response);  // Log phản hồi từ API

    // Kiểm tra nếu sự kiện đã được duyệt thành công
    if (response && response.message === "Cập nhật trạng thái sự kiện thành công!") {
      setEvents(events.filter(event => event._id !== eventId));  // Loại bỏ sự kiện đã duyệt khỏi danh sách
      setMessage('Sự kiện đã được duyệt!');
      setTimeout(() => setMessage(""), 3000);  // Ẩn thông báo sau 3 giây
    } else {
      setMessage("❌ Lỗi khi duyệt sự kiện.");
    }
  }).catch(err => {
    console.error("Lỗi khi duyệt sự kiện", err);
    setMessage("❌ Lỗi khi duyệt sự kiện.");
  });
};




  const handleReject = (eventId) => {
    // Gọi API từ chối sự kiện
    updateEventStatus(eventId, 'rejected').then(() => {
      setEvents(events.filter(event => event._id !== eventId));  // Loại bỏ sự kiện đã từ chối khỏi danh sách
      setMessage('Sự kiện đã bị từ chối!');
      setTimeout(() => setMessage(""), 3000); // Ẩn thông báo sau 3 giây
    }).catch(err => console.error("Lỗi khi từ chối sự kiện", err));
  };

  const getIcon = (type) => {
    const icons = {
      'success': '✅',
      'warning': '⚠️',
      'info': 'ℹ️',
      'error': '❌'
    };
    return icons[type] || 'ℹ️';
  };

  const getTypeClass = (type) => {
    return `notification-${type}`;
  };

  if (loading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="notification-page">
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
          <h2>Danh sách sự kiện chờ duyệt</h2>
          <p style={{ color: '#7f8c8d', marginTop: '8px' }}>
            Bạn có {events.length} sự kiện chờ duyệt
          </p>
        </div>
      </div>

      {message && <p>{message}</p>}

      <div className="notifications-list">
        {events.map((event) => (
          <div 
            key={event._id} 
            className={`event-item ${event.status === 'approved' ? 'approved' : event.status === 'rejected' ? 'rejected' : 'pending'}`}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              marginBottom: '16px'
            }}
          >
            <div 
              className={`event-icon ${getTypeClass(event.status)}`}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
                background: event.status === 'approved' ? '#d4edda' :
                           event.status === 'rejected' ? '#f8d7da' :
                           '#fff3cd'
              }}
            >
              {getIcon(event.status)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50', margin: 0 }}>
                  {event.eventName}
                </h4>
                <span style={{ fontSize: '12px', color: '#95a5a6' }}>
                  {event.eventDate}
                </span>
              </div>
              <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                {event.description}
              </p>
              <div>
                <button 
                  onClick={() => handleApprove(event._id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#28a745',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Duyệt
                </button>
                <button 
                  onClick={() => handleReject(event._id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
fontSize: '13px',
                    fontWeight: 600,
                    padding: '5px',
                    cursor: 'pointer'
                  }}
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
