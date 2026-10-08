import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  adminGetPlans,
  adminUpdatePlan,
  adminGetSubscribers,
  adminGetStats,
} from "../../api/membershipApi";
import "../css/MembershipManager.css";

export default function MembershipManager() {
  const [activeTab, setActiveTab] = useState("subscribers"); // "subscribers" | "plans"
  const [plans, setPlans] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [stats, setStats] = useState({
    totalActive: 0,
    vipCount: 0,
    premiumCount: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({});

  const token = localStorage.getItem("adminToken") || localStorage.getItem("token");

  const loadData = async () => {
    try {
      setLoading(true);
      const [plansRes, subsRes, statsRes] = await Promise.all([
        adminGetPlans(token),
        adminGetSubscribers(token),
        adminGetStats(token),
      ]);

      if (plansRes?.success) setPlans(plansRes.data || []);
      if (subsRes?.success) setSubscribers(subsRes.data || []);
      if (statsRes?.success) setStats(statsRes.data || {});
    } catch (err) {
      console.error("Lỗi tải dữ liệu admin membership:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleEditClick = (plan) => {
    setEditingPlan(plan);
    setFormData({
      displayName: plan.displayName,
      price: plan.price,
      discountPercent: plan.discountPercent,
      earlyAccessMinutes: plan.earlyAccessMinutes,
      monthlyVouchers: plan.monthlyVouchers,
      isActive: plan.isActive,
    });
  };

  const handleSavePlan = async () => {
    try {
      const res = await adminUpdatePlan(editingPlan._id, formData, token);
      if (res?.success) {
        Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Đã cập nhật gói hội viên!",
          background: "#141824",
          color: "#e2e8f0",
          confirmButtonColor: "#00E599",
        });
        setEditingPlan(null);
        loadData();
      } else {
        Swal.fire({
          icon: "error",
          title: "Thất bại",
          text: res?.message || "Không thể cập nhật.",
          background: "#141824",
          color: "#e2e8f0",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Lỗi kết nối máy chủ.",
        background: "#141824",
        color: "#e2e8f0",
      });
    }
  };

  return (
    <div className="membership-manager">
      {/* Header */}
      <div className="mm-header">
        <h2 className="mm-title">
          <span>👑</span> Quản lý Gói Hội viên & Người đăng ký
        </h2>
        <div className="mm-tabs">
          <button
            className={`mm-tab-btn ${activeTab === "subscribers" ? "active" : ""}`}
            onClick={() => setActiveTab("subscribers")}
          >
            📋 Danh sách Hội viên ({subscribers.length})
          </button>
          <button
            className={`mm-tab-btn ${activeTab === "plans" ? "active" : ""}`}
            onClick={() => setActiveTab("plans")}
          >
            ⚙️ Cấu hình Gói ({plans.length})
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mm-stats-row">
        <div className="mm-stat-card">
          <div className="mm-stat-icon" style={{ color: "#00E599" }}>
            👥
          </div>
          <div>
            <p className="mm-stat-title">Hội viên đang Active</p>
            <h3 className="mm-stat-val">{stats.totalActive || 0}</h3>
          </div>
        </div>

        <div className="mm-stat-card">
          <div className="mm-stat-icon" style={{ color: "#f59e0b" }}>
            👑
          </div>
          <div>
            <p className="mm-stat-title">Hội viên VIP</p>
            <h3 className="mm-stat-val">{stats.vipCount || 0}</h3>
          </div>
        </div>

        <div className="mm-stat-card">
          <div className="mm-stat-icon" style={{ color: "#00b4d8" }}>
            ⭐
          </div>
          <div>
            <p className="mm-stat-title">Hội viên Premium</p>
            <h3 className="mm-stat-val">{stats.premiumCount || 0}</h3>
          </div>
        </div>

        <div className="mm-stat-card">
          <div className="mm-stat-icon" style={{ color: "#10b981" }}>
            💰
          </div>
          <div>
            <p className="mm-stat-title">Tổng doanh thu Hội viên</p>
            <h3 className="mm-stat-val">
              {(stats.totalRevenue || 0).toLocaleString()} VND
            </h3>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#00E599", padding: "40px" }}>
          ⏳ Đang tải dữ liệu...
        </div>
      ) : activeTab === "subscribers" ? (
        /* SUBSCRIBERS TABLE */
        <div className="mm-table-container">
          <table className="mm-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Gói Hội viên</th>
                <th>Giá thanh toán</th>
                <th>Ngày kích hoạt</th>
                <th>Ngày hết hạn</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "30px" }}>
                    Chưa có người dùng nào đăng ký gói Premium / VIP.
                  </td>
                </tr>
              ) : (
                subscribers.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      <div className="user-cell">
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#2a334a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            color: "#00E599",
                          }}
                        >
                          {sub.userId?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <span style={{ fontWeight: 600, color: "#ffffff" }}>
                          {sub.userId?.name || "Người dùng"}
                        </span>
                      </div>
                    </td>
                    <td>{sub.userId?.email || "—"}</td>
                    <td>
                      <span
                        className={`badge-tag ${
                          sub.planName === "VIP"
                            ? "vip"
                            : sub.planName === "PREMIUM"
                            ? "premium"
                            : "free"
                        }`}
                      >
                        {sub.planName === "VIP" ? "👑 VIP" : "⭐ PREMIUM"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#ffffff" }}>
                      {(sub.amount || 0).toLocaleString()} VND
                    </td>
                    <td>
                      {sub.startDate
                        ? new Date(sub.startDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td>
                      {sub.endDate
                        ? new Date(sub.endDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          sub.status === "ACTIVE"
                            ? "active"
                            : sub.status === "EXPIRED"
                            ? "expired"
                            : "cancelled"
                        }`}
                      >
                        {sub.status === "ACTIVE"
                          ? "Hoạt động"
                          : sub.status === "EXPIRED"
                          ? "Hết hạn"
                          : "Đã hủy"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* PLANS CONFIGURATION TABLE */
        <div className="mm-table-container">
          <table className="mm-table">
            <thead>
              <tr>
                <th>Mã gói</th>
                <th>Tên hiển thị</th>
                <th>Giá gói (VND/tháng)</th>
                <th>Early Access</th>
                <th>Giảm phí dịch vụ</th>
                <th>Voucher / tháng</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p._id}>
                  <td>
                    <span
                      className={`badge-tag ${
                        p.name === "VIP"
                          ? "vip"
                          : p.name === "PREMIUM"
                          ? "premium"
                          : "free"
                      }`}
                    >
                      {p.name}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "#ffffff" }}>
                    {p.displayName}
                  </td>
                  <td style={{ fontWeight: 700, color: "#00E599" }}>
                    {p.price.toLocaleString()} VND
                  </td>
                  <td>{p.earlyAccessMinutes > 0 ? `Sớm ${p.earlyAccessMinutes} phút` : "Không"}</td>
                  <td>{p.discountPercent > 0 ? `Giảm ${p.discountPercent}%` : "0%"}</td>
                  <td>{p.monthlyVouchers} voucher</td>
                  <td>
                    <span
                      className={`status-badge ${
                        p.isActive ? "active" : "cancelled"
                      }`}
                    >
                      {p.isActive ? "Đang mở bán" : "Tạm khóa"}
                    </span>
                  </td>
                  <td>
                    <button
                      style={{
                        background: "rgba(255, 255, 255, 0.08)",
                        border: "none",
                        color: "#00E599",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                      onClick={() => handleEditClick(p)}
                    >
                      ✏️ Sửa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="mm-modal-overlay" onClick={() => setEditingPlan(null)}>
          <div className="mm-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="mm-modal-title">
              Chỉnh sửa gói {editingPlan.name}
            </h3>

            <div className="mm-form-group">
              <label>Tên hiển thị</label>
              <input
                type="text"
                className="mm-form-input"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
            </div>

            <div className="mm-form-group">
              <label>Giá (VND)</label>
              <input
                type="number"
                className="mm-form-input"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                disabled={editingPlan.name === "FREE"}
              />
            </div>

            <div className="mm-form-group">
              <label>Thời gian Early Access (phút mở bán sớm)</label>
              <input
                type="number"
                className="mm-form-input"
                value={formData.earlyAccessMinutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    earlyAccessMinutes: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="mm-form-group">
              <label>Giảm giá phí dịch vụ (%)</label>
              <input
                type="number"
                className="mm-form-input"
                value={formData.discountPercent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    discountPercent: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="mm-form-group">
              <label>Số voucher hàng tháng</label>
              <input
                type="number"
                className="mm-form-input"
                value={formData.monthlyVouchers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyVouchers: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="mm-form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  style={{ marginRight: 8 }}
                />
                Kích hoạt gói bán
              </label>
            </div>

            <div className="mm-modal-actions">
              <button
                className="mm-btn-cancel"
                onClick={() => setEditingPlan(null)}
              >
                Hủy
              </button>
              <button className="mm-btn-save" onClick={handleSavePlan}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
