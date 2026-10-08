import { API_BASE_URL } from "../../config.js";

const BASE_URL = `${API_BASE_URL}/api/admin`;

const getToken = () => localStorage.getItem("adminToken");

// 🟦 Báo cáo tổng hệ thống
export const fetchAdminReports = async () => {
  const res = await fetch(`${BASE_URL}/reports`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

// 🟧 Báo cáo chi tiết theo từng sự kiện
export const fetchEventReport = async (eventId) => {
  const res = await fetch(`${BASE_URL}/events/${eventId}/report`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};
