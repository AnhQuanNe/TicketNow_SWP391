const BASE_URL = "http://localhost:5000/api/admin";

const getToken = () => localStorage.getItem("adminToken");

export const adminFetchEvents = async () => {
  const res = await fetch(`${BASE_URL}/events`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

export const adminGetEventDetail = async (id) => {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

export const adminUpdateEvent = async (id, data) => {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const adminDeleteEvent = async (id) => {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};
// =============================
// 🟦 ADMIN – LẤY REPORT TỔNG
// =============================
export const fetchAdminReports = async () => {
  const res = await fetch(`${BASE_URL}/reports`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.json();
};
