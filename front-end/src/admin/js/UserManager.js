import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "../css/UserManager.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // 🔍 Thêm state tìm kiếm

  // 🟢 Lấy danh sách user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("adminToken");
        if (!token) {
          alert("⚠️ Bạn chưa đăng nhập admin!");
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        console.log("📦 Kết quả API /api/users:", data);

        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.warn("⚠️ API không trả về mảng user hợp lệ:", data);
          setUsers([]);
        }
      } catch (err) {
        console.error("❌ Lỗi fetch API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 🧾 Xuất Excel
  const exportToExcel = () => {
    if (!users.length) {
      alert("Chưa có dữ liệu để xuất!");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(
      users.map((u) => ({
        ID: u._id,
        Tên: u.name,
        Email: u.email,
        "Số điện thoại": u.phone || "—",
        "Vai trò": u.role || "user",
        "Ngày tạo": new Date(u.createdAt).toLocaleDateString("vi-VN"),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "DanhSachNguoiDung.xlsx");
  };

  // 🗑️ Xóa tài khoản
  const handleDelete = async (user) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("adminToken");

    if (window.confirm(`Bạn có chắc muốn xóa ${user.name}?`)) {
      try {
        const res = await fetch(
          `http://localhost:5000/api/users/admin/${user._id}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json();
        alert(data.message);
        setUsers(users.filter((u) => u._id !== user._id));
      } catch (error) {
        alert("Lỗi khi xóa người dùng!");
      }
    }
  };

  // 🔒 Mở modal khóa tài khoản
  const handleBan = (user) => {
    if (!user.isBanned) {
      setSelectedUser(user);
      setShowBanModal(true);
    } else {
      if (window.confirm(`Mở khóa tài khoản ${user.name}?`)) {
        unbanUser(user);
      }
    }
  };

  // ✅ Gửi yêu cầu khóa
  const confirmBan = async () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (!banReason.trim()) {
      alert("❗Vui lòng nhập lý do khóa tài khoản.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/users/admin/ban/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: banReason }),
        }
      );
      const data = await res.json();
      alert(data.message);

      setUsers((prev) =>
        prev.map((u) =>
          u._id === selectedUser._id
            ? { ...u, isBanned: true, banReason: banReason }
            : u
        )
      );

      setShowBanModal(false);
      setBanReason("");
      setSelectedUser(null);
    } catch {
      alert("Lỗi khi khóa tài khoản!");
    }
  };

  // 🔓 Mở khóa tài khoản
  const unbanUser = async (user) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("adminToken");

    try {
      const res = await fetch(
        `http://localhost:5000/api/users/admin/ban/${user._id}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      alert(data.message);
      setUsers(
        users.map((u) =>
          u._id === user._id ? { ...u, isBanned: false, banReason: "" } : u
        )
      );
    } catch {
      alert("Lỗi khi mở khóa!");
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // 🔍 Lọc người dùng theo tên hoặc email
  const filteredUsers = users
    .filter((u) => u.role !== "role_admin")
    .filter((u) => {
      const keyword = searchTerm.toLowerCase().trim();
      return (
        u.name?.toLowerCase().includes(keyword) ||
        u.email?.toLowerCase().includes(keyword)
      );
    });

  return (
    <div className="user-manager">
      <div className="user-header">
        <h2 className="user-title">Danh sách người dùng</h2>

        {/* 🔍 Ô tìm kiếm ở giữa */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button className="export-btn" onClick={exportToExcel}>
          📥 Xuất Excel
        </button>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">😕</div>
          <h3>Không tìm thấy người dùng</h3>
          <p>Thử nhập từ khóa khác hoặc kiểm tra chính tả.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Ngày tạo</th>
                <th>Xóa</th>
                <th>Khóa</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id}>
                  <td className="user-id">{u._id.slice(-8)}</td>
                  <td>
                    <strong>{u.name}</strong>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || "—"}</td>
                  <td>
                    <span className={`role-badge role-${u.role || "user"}`}>
                      {u.role || "user"}
                    </span>
                  </td>
                  <td>{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(u)}
                      title="Xóa người dùng"
                      className="delete-btn"
                    >
                      🗑️
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => handleBan(u)}
                      title={
                        u.isBanned ? "Mở khóa tài khoản" : "Khóa tài khoản"
                      }
                      className={u.isBanned ? "unban-btn" : "ban-btn"}
                    >
                      {u.isBanned ? "🔓" : "🔒"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🟣 Modal khóa tài khoản */}
      {showBanModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>🔒 Khóa tài khoản</h3>
            <p>
              Bạn có chắc muốn khóa tài khoản của{" "}
              <strong>{selectedUser?.name}</strong>?
            </p>
            <textarea
              placeholder="Nhập lý do khóa tài khoản..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
            />
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowBanModal(false)}
              >
                Hủy
              </button>
              <button className="confirm-btn" onClick={confirmBan}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
