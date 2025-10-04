import React from "react";
import { Link } from "react-router-dom";
import "../css/Categories.css";

function Categories({ categoriesFromBackend = [] }) {
  // Danh sách category cố định để hiển thị dưới menu
  const fixedCategories = [
    { _id: "music", name: "Âm nhạc" },
    { _id: "workshop", name: "Hội thảo" },
    { _id: "sport", name: "Thể thao" },
    { _id: "market", name: "Hội chợ" },
  ];

  const allCategories = [...fixedCategories, ...categoriesFromBackend];

  return (
    <div className="categories-menu">
      {allCategories.map(cat => (
        <Link key={cat._id} to={`/category/${cat._id}`} className="category-link">
          {cat.name}
        </Link>
      ))}
    </div>
  );
}

export default Categories;
