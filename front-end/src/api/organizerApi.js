import axios from "axios";

const ORGANIZER_API_URL = "http://localhost:5000/api/organizer";
const EVENT_REQUEST_API_URL = "http://localhost:5000/api/event-requests";


// =============================
// Lấy thông tin hồ sơ của tổ chức
// =============================
export const getOrganizerProfile = async (token) => {
  try {
    const res = await axios.get(`${ORGANIZER_API_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Trả về dữ liệu hồ sơ của tổ chức
  } catch (error) {
    console.error("Lỗi khi lấy hồ sơ tổ chức:", error);
    throw error;
  }
};


// =============================
// Cập nhật hồ sơ của tổ chức
// =============================
export const updateOrganizerProfile = async (token, data) => {
  try {
    const res = await axios.put(`${ORGANIZER_API_URL}/profile`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data; // Trả về dữ liệu đã được cập nhật
  } catch (error) {
    console.error("Lỗi khi cập nhật hồ sơ tổ chức:", error);
    throw error;
  }
};


// =============================
// Tạo sự kiện mới cho Organizer
// =============================
export const createEventRequest = async (token, body) => {
  try {
    const res = await axios.post(`${EVENT_REQUEST_API_URL}`, body, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi tạo sự kiện:", error);
    throw error;
  }
};


// =============================
// Lấy danh sách sự kiện của Organizer
// =============================
export const getAllEventRequests = async (token) => {
  try {
    const res = await axios.get(`${EVENT_REQUEST_API_URL}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách sự kiện:", error);
    throw error;
  }
};


// =============================
// Cập nhật trạng thái sự kiện (Duyệt/Từ chối) cho Admin
// =============================
// API để cập nhật trạng thái sự kiện
export const updateEventStatus = async (eventId, status) => {
  const token = localStorage.getItem("token"); // ✔️ thêm dòng này
  try {
    const res = await axios.put(`http://localhost:5000/api/event-requests/status`, {
      eventId,
      status
    }, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái sự kiện:", error);
    throw error;
  }
};
