const BASE_URL = "http://localhost:5000/api/admin";

const getToken = () => localStorage.getItem("adminToken");

// Lấy danh sách sự kiện
export const adminFetchEvents = async () => {
  const res = await fetch(`${BASE_URL}/events`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

// Lấy chi tiết 1 sự kiện
export const adminGetEventDetail = async (id) => {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};

// Cập nhật sự kiện
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

// Xóa sự kiện
export const adminDeleteEvent = async (id) => {
  const res = await fetch(`${BASE_URL}/events/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return res.json();
};