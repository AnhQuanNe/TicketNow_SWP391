import React, { useEffect, useState } from "react";
import "../css/EventManager.css";
import * as XLSX from "xlsx";

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const categoryMap = {
    cat_music: "Âm nhạc",
    cat_workshop: "Workshop / Kỹ năng",
    cat_market: "Hội chợ",
    cat_sport: "Thể thao",
    cat_sports: "Thể thao",
  };

  // 🟢 Lấy danh sách sự kiện từ backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/events/search");
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ Lỗi tải sự kiện:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🟢 Lấy danh mục sự kiện
  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error("❌ Lỗi tải danh mục:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  // 🗑️ Xóa sự kiện
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa sự kiện này không?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        alert("✅ Đã xóa sự kiện thành công!");
        fetchEvents();
      } else {
        alert("❌ Không thể xóa sự kiện!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi xóa sự kiện!");
    }
  };

  // ✏️ Mở modal chỉnh sửa
  const handleEdit = (ev) => {
    setSelectedEvent(ev);
    setShowModal(true);
  };

  // 💾 Lưu thay đổi
  const handleSave = async () => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(
        `http://localhost:5000/api/events/${selectedEvent._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedEvent),
        }
      );
      if (res.ok) {
        alert("✅ Cập nhật sự kiện thành công!");
        setShowModal(false);
        fetchEvents();
      } else {
        alert("❌ Không thể cập nhật sự kiện!");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi cập nhật!");
    }
  };

  // 🔍 Lọc sự kiện theo tên hoặc danh mục
  const filteredEvents = events.filter(
    (ev) =>
      ev.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.categoryId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 📥 Xuất file Excel
  const exportToExcel = () => {
    if (!events.length) {
      alert("⚠️ Không có dữ liệu để xuất!");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      events.map((e) => ({
        ID: e._id,
        "Tên sự kiện": e.title,
        "Danh mục":
          categories.find((c) => c._id === e.categoryId)?.name ||
          e.categoryId ||
          "—",
        "Địa điểm": e.locationId?.name || e.locationId || "—",
        "Ngày diễn ra": new Date(e.date).toLocaleDateString("vi-VN"),
        "Vé còn lại": e.ticketsAvailable ?? "—",
        "Trạng thái": e.isActive ? "Hiển thị" : "Ẩn",
        "Ngày tạo": new Date(e.createdAt).toLocaleDateString("vi-VN"),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sự kiện");
    XLSX.writeFile(workbook, "DanhSachSuKien.xlsx");
  };

  return (
    <div className="event-manager">
      {/* Header */}
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

      {/* Table */}
      {loading ? (
        <p>⏳ Đang tải dữ liệu...</p>
      ) : filteredEvents.length === 0 ? (
        <p>Không có sự kiện nào</p>
      ) : (
        <table className="event-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ảnh</th>
              <th>Tên sự kiện</th>
              <th>Danh mục</th>
              <th>Ngày</th>
              <th>Vé còn lại</th>
              <th>Thao tác</th>
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
                  <td>{categoryMap[ev.categoryId] || "Không rõ"}</td>
                </td>
                <td>{new Date(ev.date).toLocaleDateString()}</td>
                <td>{ev.ticketsAvailable ?? "—"}</td>
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(ev)}>
                    ✏️
                  </button>
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

      {/* Modal chỉnh sửa */}
      {showModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Chỉnh sửa sự kiện</h3>

            <label>Tiêu đề</label>
            <input
              type="text"
              value={selectedEvent.title}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, title: e.target.value })
              }
            />

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

            <label>Ngày tổ chức</label>
            <input
              type="date"
              value={selectedEvent.date?.substring(0, 10)}
              onChange={(e) =>
                setSelectedEvent({ ...selectedEvent, date: e.target.value })
              }
            />

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
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="modal-actions">
              <button onClick={handleSave} className="save-btn">
                💾 Lưu
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="cancel-btn"
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
