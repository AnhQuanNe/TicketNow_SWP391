import React from "react";
import { Link } from "react-router-dom";

function MyNavbar({ categories }) {
  return (
    <nav className="nav-links">
      <Link to="/">Trang chủ</Link>
      <Link to="/about">Giới thiệu</Link>
      <Link to="/news">Tin tức</Link>
      <button className="my-ticket">Vé của tôi</button>
      <button className="create-events">Tạo sự kiện</button>

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
