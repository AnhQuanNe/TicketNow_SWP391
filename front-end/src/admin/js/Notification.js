import React, { useState, useEffect } from 'react';

export default function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetch('http://localhost:5000/api/notifications')
    .then(res => res.json())
    .then(data => {
      const arr = Array.isArray(data)
        ? data
        : data.notifications || []; // ✅ đảm bảo luôn là mảng
      setNotifications(arr);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setNotifications(mockNotifications);
      setLoading(false);
    });
}, []);


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

  const markAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
    
    // TODO: Call API to mark as read
    fetch(`http://localhost:5000/api/notifications/${id}/read`, {
      method: 'PUT'
    }).catch(err => console.error(err));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    
    // TODO: Call API
    fetch('http://localhost:5000/api/notifications/mark-all-read', {
      method: 'PUT'
    }).catch(err => console.error(err));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
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
          <h2>Thông báo</h2>
          <p style={{ color: '#7f8c8d', marginTop: '8px' }}>
            Bạn có {unreadCount} thông báo chưa đọc
          </p>
        </div>
        <button 
          onClick={markAllAsRead}
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
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="notifications-list">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className={`notification-item ${notif.read ? 'read' : 'unread'}`}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              gap: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              borderLeft: notif.read ? 'none' : '4px solid #FF8C42',
              marginBottom: '16px'
            }}
          >
            <div 
              className={`notification-icon ${getTypeClass(notif.type)}`}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
                background: notif.type === 'success' ? '#d4edda' :
                           notif.type === 'warning' ? '#fff3cd' :
                           notif.type === 'info' ? '#d1ecf1' : '#f8d7da'
              }}
            >
              {getIcon(notif.type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#2c3e50', margin: 0 }}>
                  {notif.title}
                </h4>
                <span style={{ fontSize: '12px', color: '#95a5a6' }}>
                  {notif.time}
                </span>
              </div>
              <p style={{ color: '#7f8c8d', fontSize: '14px', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                {notif.message}
              </p>
              {!notif.read && (
                <button 
                  onClick={() => markAsRead(notif.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FF8C42',
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: 0,
                    cursor: 'pointer'
                  }}
                >
                  Đánh dấu đã đọc
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const mockNotifications = [
  {
    id: 1,
    type: 'success',
    title: 'Đơn hàng mới',
    message: 'Có 5 đơn đặt vé mới cho sự kiện "Đại nhạc hội Rock Việt"',
    time: '5 phút trước',
    read: false
  },
  {
    id: 2,
    type: 'warning',
    title: 'Vé sắp hết',
    message: 'Sự kiện "Hội thảo AI" chỉ còn 50 vé',
    time: '1 giờ trước',
    read: false
  },
  {
    id: 3,
    type: 'info',
    title: 'Cập nhật hệ thống',
    message: 'Hệ thống sẽ bảo trì vào 2h sáng ngày mai',
    time: '3 giờ trước',
    read: true
  },
  {
    id: 4,
    type: 'success',
    title: 'Thanh toán thành công',
    message: 'Nhận được thanh toán 2,500,000đ từ khách hàng',
    time: '1 ngày trước',
    read: true
  }
];