import React from "react";

function Categories({ categories, selectedCategory, setSelectedCategory }) {
    return (
      <div className="categories">
        {categories.map((cat) => (
          <button
            key={cat.key}
            className={selectedCategory === cat.key ? "active" : ""}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>
    );
  }
  export default Categories;
  