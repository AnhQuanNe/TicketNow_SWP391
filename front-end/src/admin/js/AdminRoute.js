// src/admin/js/AdminRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
      if (!token) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setAllowed(false);
        } else {
          const data = await res.json();
          setAllowed(data.role === "admin");
        }
      } catch (err) {
        console.error("Error verifying admin token:", err);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, []);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!allowed) return <Navigate to="/" replace />;
  return children;
}