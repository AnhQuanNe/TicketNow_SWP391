// src/api/authAPI.js
const API_URL = "http://localhost:5000/api/auth";

export async function loginUser(credentials) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
  return data;
}

export async function registerUser(userData) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng ký thất bại");
  return data;
}

export async function googleLoginUser(googleData) {
  const res = await fetch(`${API_URL}/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(googleData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Đăng nhập Google thất bại");
  return data;
}

