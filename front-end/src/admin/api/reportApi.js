const BASE_URL = "http://localhost:5000/api/admin";

const getToken = () => localStorage.getItem("adminToken");

export const fetchAdminReports = async () => {
  const res = await fetch(`${BASE_URL}/reports`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  return res.json();
};
