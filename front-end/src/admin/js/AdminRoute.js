// src/admin/js/AdminRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  // ✅ Lấy token admin trong localStorage
  const token = localStorage.getItem("adminToken");

  // 🚫 Nếu chưa đăng nhập admin -> chặn
  if (!token) {
    console.warn("❌ Chưa đăng nhập admin, chuyển về trang chủ!");
    return <Navigate to="/" replace />;
  }

  // ✅ Nếu có token -> cho phép truy cập admin
  return children;
}
