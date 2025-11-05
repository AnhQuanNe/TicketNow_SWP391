import React from "react";
import { Link, useNavigate } from "react-router-dom";

function MyNavbar({ categories }) {
  const navigate = useNavigate();
  const handleCreateEvent = () => {
    navigate("/organizer");
  }
  return (
    <nav className="nav-links">
      <Link to="/category/music">Âm nhạc</Link>
      <Link to="/category/workshop">Hội thảo</Link>
      <Link to="/category/sport">Thể thao</Link>
      <Link to="/category/market">Hội chợ</Link>
      <button className="my-ticket"onClick= {handleCreateEvent}>Vé của tôi</button>
      <button className="create-events"onClick= {handleCreateEvent}>Tạo sự kiện</button>

      {/* Menu category chuyển sang trang riêng */}
      {categories && categories.map(cat => (
        <Link key={cat._id} to={`/category/${cat._id}`}>
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}

export default MyNavbar;
