import React from "react";
import { Link, useNavigate } from "react-router-dom";

function MyNavbar({ categories }) {
  const navigate = useNavigate();
  const handleCreateEvent = () => {
    navigate("/organizer");
  }
  return (
    <nav className="nav-links">
      <Link to="/music">Âm nhạc</Link>
      <Link to="/workshop">Hội thảo</Link>
      <Link to="/sport">Thể thao</Link>
      <Link to="s/sport">Hội chợ</Link>
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
