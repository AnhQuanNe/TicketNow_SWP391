import { API_BASE_URL } from "../config";

export const getEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/api/events`);

  if (!response.ok) {
    throw new Error("Không thể lấy danh sách sự kiện");
  }

  return response.json();
};

export const getEventById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/api/events/${id}`);

  if (!response.ok) {
    throw new Error("Không tìm thấy sự kiện");
  }

  return response.json();
};

// 🔍 Tìm kiếm và lọc sự kiện
export const searchEvents = async ({ query, startDate, endDate }) => {
  const params = new URLSearchParams();

  if (query) {
    params.append("q", query);
  }

  if (startDate) {
    params.append("startDate", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
  }

  const response = await fetch(
    `${API_BASE_URL}/api/events/search?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Không thể tìm kiếm sự kiện");
  }

  return response.json();
};