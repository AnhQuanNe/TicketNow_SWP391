// front-end/src/admin/js/EventManager.js
import React, { useEffect, useState } from "react";
import "../css/EventManager.css";
import * as XLSX from "xlsx";

// API
import {
  adminFetchEvents,
  adminUpdateEvent,
  adminDeleteEvent,
} from "../api/eventAdminApi";

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ============================
  // LOAD EVENTS + CATEGORIES
  // ============================

  const loadEvents = async () => {
    setLoading(true);
    const data = await adminFetchEvents();
    setEvents(data.events || []);
    setLoading(false);
  };

  const loadCategories = async () => {
    const res = await fetch("http://localhost:5000/api/categories");
    const data = await res.json();
    if (Array.isArray(data)) setCategories(data);
  };

  useEffect(() => {
    loadEvents();
    loadCategories();
  }, []);

  // ============================
  // DELETE EVENT
  // ============================

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa sự kiện này?")) return;

    const res = await adminDeleteEvent(id);

    if (res.success) {
      alert("Xóa thành công!");
      loadEvents();
    } else {
      alert("Xóa thất bại!");
    }
  };

  // ============================
  // EDIT EVENT
  // ============================

  const handleEdit = (ev) => {
    setSelectedEvent({
      ...ev,
      dateOnly: ev.date?.substring(0, 10),
      timeOnly: ev.date?.substring(11, 16),
    });

    setShowModal(true);
  };

  const handleSave = async () => {
    const mergedDate = `${selectedEvent.dateOnly}T${selectedEvent.timeOnly}:00`;

    const res = await adminUpdateEvent(selectedEvent._id, {
      ...selectedEvent,
      date: mergedDate,
    });

    if (res.success) {
      alert("Cập nhật thành công!");
      setShowModal(false);
      loadEvents();
    } else {
      alert("Cập nhật thất bại!");
    }
  };

  // ============================
  // FILTER SEARCH
  // ============================

  const filteredEvents = events.filter(
    (ev) =>
      ev.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.categoryId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================
  // EXPORT TO EXCEL
  // ============================

  const exportToExcel = () => {
    if (!events.length) return alert("Không có dữ liệu!");

    const ws = XLSX.utils.json_to_sheet(
      events.map((e) => ({
        ID: e._id,
        "Tên sự kiện": e.title,
        "Danh mục":
          categories.find((c) => c._id === e.categoryId)?.name || e.categoryId,
        "Địa điểm": e.locationId || "—",
        "Ngày diễn ra": new Date(e.date).toLocaleDateString("vi-VN"),
        "Vé còn lại": e.ticketsAvailable,
        "Ngày tạo": new Date(e.createdAt).toLocaleDateString("vi-VN"),
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sự kiện");
    XLSX.writeFile(wb, "DanhSachSuKien.xlsx");
  };

  // ============================
  // RENDER
  // ============================

  return (
    <div className="event-manager">
      {/* HEADER */}
      <div className="event-header">
        <h2>🎫 Quản lý Sự kiện</h2>

        <input
          type="text"
          placeholder="Tìm kiếm sự kiện..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <button className="export-btn" onClick={exportToExcel}>
          📥 Xuất Excel
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>⏳ Đang tải...</p>
      ) : filteredEvents.length === 0 ? (
        <p>Không tìm thấy sự kiện nào.</p>
      ) : (
        <table className="event-table">
          <thead>
            <tr>
              <th>STT</th>
              <th>Ảnh</th>
              <th>Tên sự kiện</th>
              <th>Danh mục</th>
              <th>Ngày</th>
              <th>Thời gian</th>
              <th>Địa điểm</th>
              <th>Vé còn lại</th>
              <th>Chỉnh sửa</th>
              <th>Xóa</th>
            </tr>
          </thead>

          <tbody>
            {filteredEvents.map((ev, idx) => (
              <tr key={ev._id}>
                <td>{idx + 1}</td>

                <td>
                  <img
                    src={ev.imageUrl || "https://via.placeholder.com/80x50"}
                    alt={ev.title}
                    className="event-img"
                  />
                </td>

                <td>{ev.title}</td>

                <td>
                  {categories.find((c) => c._id === ev.categoryId)?.name ||
                    "Không rõ"}
                </td>

                <td>{new Date(ev.date).toLocaleDateString()}</td>

                <td>{ev.date ? ev.date.substring(11, 16) : "—"}</td>
                <td>{ev.locationId || "—"}</td>

                <td>{ev.ticketsAvailable ?? "—"}</td>

                <td>
                  <button className="edit-btn" onClick={() => handleEdit(ev)}>
                    ✏️
                  </button>
                </td>

                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(ev._id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ============================
          MODAL EDIT
      ============================ */}
      {showModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content event-edit-modal">
            <h3>Chỉnh sửa sự kiện</h3>

            {/* Title */}
            <label>Tiêu đề</label>
            <input
              type="text"
              value={selectedEvent.title}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, title: e.target.value })
              }
            />

            {/* Description */}
            <label>Mô tả</label>
            <textarea
              value={selectedEvent.description}
              onChange={(e) =>
                setSelectedEvent({
                  ...selectedEvent,
                  description: e.target.value,
                })
              }
            />

            {/* Date */}
            <label>Ngày diễn ra</label>
            <input
              type="date"
              value={selectedEvent.dateOnly}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, dateOnly: e.target.value })
              }
            />

            {/* Start time */}
            <label>Giờ bắt đầu</label>
            <input
              type="time"
              value={selectedEvent.timeOnly}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, timeOnly: e.target.value })
              }
            />

            {/* Category */}
            <label>Danh mục</label>
            <select
              value={selectedEvent.categoryId}
              onChange={(e) =>
                setSelectedEvent({
                  ...selectedEvent,
                  categoryId: e.target.value,
                })
              }
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Location */}
            <label>Địa điểm</label>
            <input
              type="text"
              value={selectedEvent.locationId || ""}
              onChange={(e) =>
                setSelectedEvent({
                  ...selectedEvent,
                  locationId: e.target.value,
                })
              }
            />

            {/* Banner URL */}
            <label>Link ảnh banner</label>
            <input
              type="text"
              value={selectedEvent.imageUrl || ""}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, imageUrl: e.target.value })
              }
            />

            {/* ACTIONS */}
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSave}>
                💾 Lưu
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                ❌ Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
