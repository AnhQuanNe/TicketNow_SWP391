import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_BASE_URL } from "../../config.js";

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
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
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