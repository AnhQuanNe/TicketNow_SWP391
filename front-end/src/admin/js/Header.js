import React from 'react';
import "../css/Header.css"

export default function Header({ title = 'Dashboard' }) {
  // const [searchQuery, setSearchQuery] = useState('');
  // const [notifications] = useState(3);

  // const handleSearch = (e) => {
  //   setSearchQuery(e.target.value);
  //   // TODO: Xử lý tìm kiếm
  //   console.log('Tìm kiếm:', e.target.value);
  // };

  return (
    <header className="header">
      <h1 className="header-title"  style={{textAlign: 'center'}}>{title}</h1>

      {/* <div className="header-center">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="header-actions">
        <img
          src="https://flagcdn.com/w80/gb.png"
          alt="Language"
          className="flag-icon"
        />

        <button className="notification-btn">
          🔔
          {notifications > 0 && (
            <span className="notification-badge">{notifications}</span>
          )}
        </button>

        <div className="user-profile">
          <img
            src="https://i.pravatar.cc/150?img=12"
            alt="Aiden Max"
            className="user-avatar"
          />
          <span className="user-name">Aiden Max</span>
          <span className="dropdown-icon">▼</span>
        </div>
      </div> */}
    </header>
  );
}