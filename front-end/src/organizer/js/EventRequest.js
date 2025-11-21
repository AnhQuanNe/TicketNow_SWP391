// front-end/src/organizer/EventRequest.js
import React, { useState, useRef } from "react";
import OrganizerRules from "./OrganizerRule.js";
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
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);
  const fileInputRef = useRef(null); // Thêm ref cho input file
  const [showRules, setShowRules] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // load categories to populate select
  React.useEffect(() => {
    fetch("http://localhost:5000/api/categories")
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
    setErrorMessage("");
    setMessage("");
    setErrors({});

    // REQUIRED FIELDS VALIDATION
    const requiredFields = [
      'eventName','eventDate','categoryId','startTime','eventLocation','ticketCount','studentPrice','regularPrice','description'
    ];
    const newErrors = {};
    requiredFields.forEach(f => { if (!String(formData[f]||'').trim()) newErrors[f] = 'required'; });

    // Date must be future
    if (formData.eventDate) {
      const currentDate = new Date();
      const eventDateObj = new Date(formData.eventDate);
      if (eventDateObj <= currentDate) {
        newErrors.eventDate = 'pastDate';
      }
    }

    if (!agreed) {
      newErrors.agreed = 'notAgreed';
    }

    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setErrorMessage('⚠️ Vui lòng nhập đủ các trường bắt buộc và xác nhận đã đọc quy định.');
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setErrorMessage("⚠️ Bạn cần đăng nhập trước khi tạo sự kiện.");
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
      setMessage(res.message || "Gửi yêu cầu sự kiện thành công!");

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
        categoryId: "",
        startTime: ""
      });
      setAgreed(false);

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
          Tên Sự Kiện<span className="required-star">*</span>
          <input
            type="text"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            className={errors.eventName ? 'input-error' : ''}
            required
          />
        </label>

        <label>
          Ngày Diễn Ra<span className="required-star">*</span>
          <input
            type="date"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleChange}
            className={errors.eventDate ? 'input-error' : ''}
            required
          />
        </label>

        <label>
          Thể loại (Category)<span className="required-star">*</span>
          <select
            name="categoryId"
value={formData.categoryId}
            onChange={handleChange}
            className={errors.categoryId ? 'input-error' : ''}
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
          Thời gian bắt đầu<span className="required-star">*</span>
          <input
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleChange}
            className={errors.startTime ? 'input-error' : ''}
            required
          />
        </label>

        <label>
          Địa Điểm<span className="required-star">*</span>
          <input
            type="text"
            name="eventLocation"
            value={formData.eventLocation}
            onChange={handleChange}
            className={errors.eventLocation ? 'input-error' : ''}
            required
          />
        </label>

        <label>
          Số Lượng Vé<span className="required-star">*</span>
          <input
            type="number"
            name="ticketCount"
            value={formData.ticketCount}
            onChange={handleChange}
            className={errors.ticketCount ? 'input-error' : ''}
            required
          />
        </label>

        {/* 🟢 THÊM 2 INPUT GIÁ VÉ MỚI */}
        <label>
          Giá Vé Học Sinh (VND)<span className="required-star">*</span>
          <input
            type="number"
            name="studentPrice"
            value={formData.studentPrice}
            onChange={handleChange}
            className={errors.studentPrice ? 'input-error' : ''}
            required
          />
        </label>

        <label>
          Giá Vé Người Thường (VND)<span className="required-star">*</span>
          <input
            type="number"
            name="regularPrice"
            value={formData.regularPrice}
            onChange={handleChange}
            className={errors.regularPrice ? 'input-error' : ''}
            required
          />
        </label>

        <label>
          Mô Tả Sự Kiện<span className="required-star">*</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Mô tả ngắn gọn về sự kiện..."
            className={errors.description ? 'input-error' : ''}
            required
          />
        </label>

        <label>
          Ảnh Bìa
          <input
            type="file"
            name="coverImage"
            accept="image/*"
onChange={handleChange}
          />
        </label>

        <div className="rules-confirm">
          <span className="rules-badge">QUY ĐỊNH</span>
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className={errors.agreed ? 'input-error' : ''}
          />
          <div className="rules-text">
            Tôi xác nhận đã đọc và đồng ý với <button type="button" className="rules-link" onClick={() => setShowRules(true)}>Quy định Ban Tổ Chức</button> của nền tảng.
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Gửi Yêu Cầu
        </button>
      </form>

      {errorMessage && <p className="error-message">{errorMessage}</p>}
      {message && !errorMessage && <p className="success-message">{message}</p>}

      {showRules && (
        <div className="rules-modal-overlay" onClick={() => setShowRules(false)}>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
            <OrganizerRules />
            <div style={{display:'flex',justifyContent:'flex-end',marginTop:12,gap:8}}>
              <button
                type="button"
                onClick={() => { setShowRules(false); setAgreed(true); }}
                style={{
                  background:'#ff7b00',color:'#fff',border:'none',padding:'10px 18px',borderRadius:8,cursor:'pointer',fontWeight:600
                }}
              >Tôi đã đọc & đồng ý</button>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                style={{
                  background:'#eee',color:'#333',border:'1px solid #ccc',padding:'10px 18px',borderRadius:8,cursor:'pointer',fontWeight:500
                }}
              >Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}