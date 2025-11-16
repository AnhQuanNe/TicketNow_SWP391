import axios from "axios";

const API_URL = `${process.env.REACT_APP_API_URL}/users`;

// 🔹 Lấy thông tin người dùng
export const getUserById = async (userId, token) => {
  return axios.get(`${API_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 🔹 Cập nhật thông tin người dùng
export const updateUser = async (userId, data, token) => {
  return axios.put(`${API_URL}/${userId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

// 🔹 Upload ảnh đại diện
export const uploadAvatar = async (userId, file, token) => {
  const formData = new FormData();
  formData.append("avatar", file);

  return axios.put(`${API_URL}/${userId}/avatar`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
};

// 🧡 Thêm/gỡ sự kiện yêu thích
export const toggleFavoriteEvent = async (userId, eventId, token) => {
  return axios.post(
    `${API_URL}/favorites/toggle`,
    { userId, eventId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};

// 🧡 Lấy danh sách sự kiện yêu thích
export const getFavoriteEvents = async (userId, token) => {
  return axios.get(`${API_URL}/${userId}/favorites`, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
