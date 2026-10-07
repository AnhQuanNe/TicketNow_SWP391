import axios from "axios";

const API_BASE = "http://localhost:5000/api/promotions";

const getAuthHeaders = () => {
  const token =
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    localStorage.getItem("organizerToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/* ================= PUBLIC APIS ================= */
export const getPromotionPlans = async () => {
  const res = await axios.get(`${API_BASE}/plans`);
  return res.data;
};

export const getActiveBanners = async () => {
  const res = await axios.get(`${API_BASE}/active-banners`);
  return res.data;
};

export const getRankedEvents = async () => {
  const res = await axios.get(`${API_BASE}/ranked-events`);
  return res.data;
};

/* ================= ORGANIZER APIS ================= */
export const getMyEventsForPromotion = async () => {
  const res = await axios.get(`${API_BASE}/organizer/events`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const getMyPromotions = async () => {
  const res = await axios.get(`${API_BASE}/my-promotions`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const createPromotionOrder = async (payload) => {
  const res = await axios.post(`${API_BASE}/order`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const verifyPromotionPayment = async (orderCode) => {
  const res = await axios.post(
    `${API_BASE}/verify-payment`,
    { orderCode },
    {
      headers: getAuthHeaders(),
    }
  );
  return res.data;
};

/* ================= ADMIN APIS ================= */
export const adminGetAllPromotions = async () => {
  const res = await axios.get(`${API_BASE}/admin/all`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const adminUpdatePromotionStatus = async (id, status) => {
  const res = await axios.put(
    `${API_BASE}/admin/${id}/status`,
    { status },
    {
      headers: getAuthHeaders(),
    }
  );
  return res.data;
};

export const adminGetPlans = async () => {
  const res = await axios.get(`${API_BASE}/admin/plans`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const adminCreatePlan = async (payload) => {
  const res = await axios.post(`${API_BASE}/admin/plans`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const adminUpdatePlan = async (id, payload) => {
  const res = await axios.put(`${API_BASE}/admin/plans/${id}`, payload, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const adminDeletePlan = async (id) => {
  const res = await axios.delete(`${API_BASE}/admin/plans/${id}`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};

export const adminGetPromotionRevenueStats = async () => {
  const res = await axios.get(`${API_BASE}/admin/revenue-stats`, {
    headers: getAuthHeaders(),
  });
  return res.data;
};
