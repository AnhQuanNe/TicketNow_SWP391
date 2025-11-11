import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/organizer";

export const getOrganizerProfile = async (token) => {
  const res = await axios.get(`${API_BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const updateOrganizerProfile = async (token, data) => {
  const res = await axios.put(`${API_BASE_URL}/profile`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
