import { API_BASE_URL } from "../config";

// Lấy danh sách review của một event
export const getReviewsByEvent = async (eventId, page, limit) => {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews/event/${eventId}?page=${page}&limit=${limit}`
  );

  if (!response.ok) {
    throw new Error("Không thể lấy danh sách đánh giá");
  }

  return response.json();
};

// Gửi review cho event
export const createReview = async (eventId, token, reviewData) => {
  const response = await fetch(
    `${API_BASE_URL}/api/reviews/event/${eventId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Lỗi gửi review");
  }

  return data;
};