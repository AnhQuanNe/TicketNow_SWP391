import React, { useState } from "react";
import "../css/EventRequest.css";
import axios from "axios";
//js

export default function EventRequestForm() {
  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    location: "",
    ticketCount: "",
    ticketPrice: "",
    description: "",
    coverImage: null
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Tạo FormData để gửi dữ liệu + file
      const data = new FormData();
      data.append("title", formData.eventName);            // backend nhận title
      data.append("description", formData.description);
      data.append("date", formData.date);
      data.append("locationId", formData.location);        // backend nhận locationId
      data.append("ticketsAvailable", formData.ticketCount);
      data.append("ticketPrice", formData.ticketPrice);
      if (formData.coverImage) data.append("coverImage", formData.coverImage);

      const res = await axios.post("http://localhost:5000/api/events", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage(res.data.message || "Gửi yêu cầu thành công!");
      alert("Gửi yêu cầu thành công!");

      // Reset form
      setFormData({
        eventName: "",
        date: "",
        location: "",
        ticketCount: "",
        ticketPrice: "",
        description: "",
        coverImage: null,
      });
    } catch (err) {
      console.error("Lỗi gửi yêu cầu:", err);
      alert("Lỗi khi gửi yêu cầu sự kiện");
    }
  };

  return (
    <div className="event-request-container">
      <h2>Submit New Event Request</h2>
      <form onSubmit={handleSubmit} className="event-request-form" encType="multipart/form-data">
        <label>
          Event Name:
          <input
            type="text"
            name="eventName"
            value={formData.eventName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Date:
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Location:
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Ticket Count:
          <input
            type="number"
            name="ticketCount"
            value={formData.ticketCount}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Ticket Price (VND):
          <input
            type="number"
            name="ticketPrice"
            value={formData.ticketPrice}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Description:
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
          />
        </label>

        <label>
          Cover Image:
          <input type="file" name="coverImage" onChange={handleChange} />
        </label>

        <button type="submit">Submit Request</button>
      </form>

      {message && <p className="success-message">{message}</p>}
    </div>
  );
}
