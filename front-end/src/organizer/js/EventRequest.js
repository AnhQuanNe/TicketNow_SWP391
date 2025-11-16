// front-end/src/organizer/EventRequest.js
import React, { useState, useRef } from "react";
import "../css/EventRequest.css";
import { createEventRequest } from "../../api/organizerApi"; // Import hàm API
// import { useNavigate } from "react-router-dom";

export default function EventRequestForm() {
  const [formData, setFormData] = useState({
    eventName: "",
    eventDate: "",
    eventLocation: "",
    ticketCount: "",
    // ❌ XOÁ: ticketPrice, vì backend không còn dùng field này
    // ticketPrice: "",
    // 🟢 THÊM 2 TRƯỜNG MỚI TRÙNG TÊN VỚI BACKEND:
    studentPrice: "",
    regularPrice: "",
    categoryId: "",
    startTime: "",
    endTime: "",
    description: "",
    coverImage: null,
  });

  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null); // Thêm ref cho input file
  const [categories, setCategories] = useState([]);
  
  // load categories to populate select
  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data || []))
      .catch((err) => {
        console.error("Lỗi khi lấy danh sách categories", err);
        setCategories([]);
      });
  }, []);
  // const navigate = useNavigate();

  // 🟢 KHÔNG ĐỔI — vẫn dùng handleChange như cũ
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  // 🟢 CHỈ SỬA LẠI FORM DATA GỬI ĐI CHO ĐÚNG KEY
  const handleSubmit = async (e) => {
    e.preventDefault();

      // Lấy ngày hiện tại
  const currentDate = new Date();
  const eventDate = new Date(formData.eventDate);

  // Kiểm tra nếu ngày sự kiện trước ngày hiện tại
  if (eventDate <= currentDate) {
    setMessage("⚠️ Ngày sự kiện không thể trước ngày hiện tại.");
    return;
  }

    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("⚠️ Bạn cần đăng nhập trước khi tạo sự kiện.");
      return;
    }

    try {
      const data = new FormData();
      data.append("eventName", formData.eventName);
      data.append("eventDate", formData.eventDate);
      data.append("categoryId", formData.categoryId);
      data.append("startTime", formData.startTime);
      data.append("endTime", formData.endTime);
      data.append("eventLocation", formData.eventLocation);
      data.append("ticketCount", formData.ticketCount);

      // ❌ XOÁ: ticketPrice cũ
      // data.append("ticketPrice", formData.ticketPrice);

      // 🟢 THÊM 2 DÒNG NÀY CHO BACKEND NHẬN ĐÚNG KEY
      data.append("studentPrice", formData.studentPrice);
      data.append("regularPrice", formData.regularPrice);

      data.append("description", formData.description);
      if (formData.coverImage) {
        data.append("coverImage", formData.coverImage);
      }
const res = await createEventRequest(token, data);
      setMessage(res.message || "🎉 Gửi yêu cầu sự kiện thành công!");

      // Ẩn thông báo sau 3 giây
setTimeout(() => {
  setMessage("");  // Xóa thông báo
}, 3000);

      // 🟢 RESET LẠI FORM — nhớ reset thêm 2 field mới
      setFormData({
        eventName: "",
        eventDate: "",
        eventLocation: "",
        ticketCount: "",
        studentPrice: "",
        regularPrice: "",
        description: "",
        coverImage: null,  // Reset lại ảnh sau khi gửi form
      });

            // 🟢 RESET Ô ẢNH (input file)
      if (fileInputRef.current) {
        fileInputRef.current.value = null; // Đặt lại giá trị của input file thành null
      }

      // setTimeout(() => {
      //   navigate("/organizer/dashboard");
      // }, 1500);
    } catch (err) {
      console.error("Lỗi gửi yêu cầu:", err);
      setMessage("❌ Lỗi khi gửi yêu cầu sự kiện. Vui lòng thử lại.");
    }
  };

  return (
    <div className="event-request-container">
      <h2>Tạo Yêu Cầu Sự Kiện Mới</h2>

      <form
        onSubmit={handleSubmit}
        className="event-request-form"
        encType="multipart/form-data"
      >
        <label>
          Tên Sự Kiện:
          <input
            type="text"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Ngày Diễn Ra:
          <input
            type="date"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Thể loại (Category):
          <select
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              -- Chọn thể loại --
            </option>
            {categories.map((c) => {
              const id = c._id; // _id trong collection Categories (ví dụ: cat_music)
              return (
                <option key={id} value={id}>
                  {c.name}
                </option>
              );
            })}
          </select>
        </label>

        <label>
          Thời gian bắt đầu:
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
          />
        </label>

        <label>
          Địa Điểm:
          <input
            type="text"
            name="eventLocation"
            value={formData.eventLocation}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Số Lượng Vé:
          <input
            type="number"
            name="ticketCount"
value={formData.ticketCount}
            onChange={handleChange}
            required
          />
        </label>

        {/* 🟢 THÊM 2 INPUT GIÁ VÉ MỚI */}
        <label>
          Giá Vé Học Sinh (VND):
          <input
            type="number"
            name="studentPrice"
            value={formData.studentPrice}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Giá Vé Người Thường (VND):
          <input
            type="number"
            name="regularPrice"
            value={formData.regularPrice}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Mô Tả Sự Kiện:
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Mô tả ngắn gọn về sự kiện..."
          />
        </label>

        <label>
          Ảnh Bìa:
          <input
            type="file"
            name="coverImage"
            accept="image/*"
            onChange={handleChange}
          />
        </label>

        <button type="submit" className="submit-btn">
          Gửi Yêu Cầu
        </button>
      </form>

      {message && <p className="success-message">{message}</p>}
    </div>
  );
}
