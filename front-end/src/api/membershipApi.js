import axios from "axios";
import { API_BASE_URL } from "../config";

const BASE_URL = `${API_BASE_URL}/api/membership`;

// 1. Lấy danh sách gói công khai
export const getMembershipPlans = async () => {
  const res = await axios.get(`${BASE_URL}/plans`);
  return res.data;
};

// 2. Lấy thông tin gói hội viên hiện tại của tôi
export const getMyMembership = async (token) => {
  const res = await axios.get(`${BASE_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 3. Tạo link thanh toán PayOS để mua gói
export const createMembershipPayment = async (planName, token) => {
  const res = await axios.post(
    `${BASE_URL}/create-payment`,
    { planName },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 4. Xác thực thanh toán PayOS & kích hoạt gói
export const verifyMembershipPayment = async (orderCode, token, bypassMock = false) => {
  const res = await axios.post(
    `${BASE_URL}/verify-payment`,
    { orderCode, bypassMock },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

// 5. Kiểm tra quyền mua vé (Member-only & Early Access)
export const checkEventAccess = async (eventId, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(`${BASE_URL}/check-event-access/${eventId}`, {
    headers,
  });
  return res.data;
};

// 6. Tính phí dịch vụ và giảm giá theo hạng thành viên
export const calculateTicketFee = async (subtotal, token) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.post(
    `${BASE_URL}/calculate-fee`,
    { subtotal },
    { headers }
  );
  return res.data;
};

// 7. Admin: Lấy danh sách các gói
export const adminGetPlans = async (token) => {
  const res = await axios.get(`${BASE_URL}/admin/plans`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 8. Admin: Cập nhật gói
export const adminUpdatePlan = async (id, data, token) => {
  const res = await axios.put(`${BASE_URL}/admin/plans/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 9. Admin: Lấy danh sách subscribers
export const adminGetSubscribers = async (token) => {
  const res = await axios.get(`${BASE_URL}/admin/subscribers`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// 10. Admin: Thống kê hội viên & doanh thu
export const adminGetStats = async (token) => {
  const res = await axios.get(`${BASE_URL}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
