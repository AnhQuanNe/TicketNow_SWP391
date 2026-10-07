import React, { useState, useEffect } from "react";
import {
  adminGetAllPromotions,
  adminUpdatePromotionStatus,
  adminGetPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminDeletePlan,
  adminGetPromotionRevenueStats,
} from "../../api/promotionApi";
import {
  FaBullhorn,
  FaDollarSign,
  FaChartLine,
  FaCheck,
  FaTimes,
  FaPlus,
  FaTrash,
  FaEdit,
  FaCrown,
  FaStar,
  FaImage,
  FaThumbsUp,
  FaSpinner,
  FaBoxOpen,
} from "react-icons/fa";
import "../css/PromotionManager.css";

export default function PromotionManager() {
  const [activeTab, setActiveTab] = useState("promotions"); // "promotions" | "plans" | "stats"
  const [promotions, setPromotions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form tạo/sửa plan
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [planForm, setPlanForm] = useState({
    name: "",
    type: "banner",
    durationDays: 7,
    price: 500000,
    position: "home_banner",
    description: "",
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [promosRes, plansRes, statsRes] = await Promise.all([
        adminGetAllPromotions().catch(() => ({ data: [] })),
        adminGetPlans().catch(() => ({ data: [] })),
        adminGetPromotionRevenueStats().catch(() => ({ data: null })),
      ]);

      setPromotions(promosRes.data || []);
      setPlans(plansRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      console.error("Lỗi tải dữ liệu quản trị:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái promotion
  const handleUpdateStatus = async (id, newStatus) => {
    if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái thành "${newStatus}"?`)) return;
    try {
      const res = await adminUpdatePromotionStatus(id, newStatus);
      if (res.success) {
        alert("Cập nhật trạng thái thành công!");
        loadAllData();
      }
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  // Submit Plan (Create / Update)
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlanId) {
        await adminUpdatePlan(editingPlanId, planForm);
        alert("Cập nhật gói thành công!");
      } else {
        await adminCreatePlan(planForm);
        alert("Tạo gói mới thành công!");
      }
      setEditingPlanId(null);
      setPlanForm({
        name: "",
        type: "banner",
        durationDays: 7,
        price: 500000,
        position: "home_banner",
        description: "",
      });
      loadAllData();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  const handleEditClick = (plan) => {
    setEditingPlanId(plan._id);
    setPlanForm({
      name: plan.name,
      type: plan.type,
      durationDays: plan.durationDays,
      price: plan.price,
      position: plan.position || "section",
      description: plan.description || "",
    });
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói này?")) return;
    try {
      await adminDeletePlan(id);
      alert("Đã xóa gói!");
      loadAllData();
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="admin-promo-container">
      {/* HEADER & TABS */}
      <div className="admin-promo-header">
        <div>
          <h2>
            <FaBullhorn /> Quản Lý Doanh Thu & Gói Quảng Bá
          </h2>
          <p>Duyệt chiến dịch quảng bá, quản trị bảng giá gói và theo dõi dòng tiền.</p>
        </div>

        <div className="admin-promo-nav">
          <button
            className={`admin-tab-btn ${activeTab === "promotions" ? "active" : ""}`}
            onClick={() => setActiveTab("promotions")}
          >
            Chiến Dịch ({promotions.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "plans" ? "active" : ""}`}
            onClick={() => setActiveTab("plans")}
          >
            <FaBoxOpen /> Bảng Giá Gói ({plans.length})
          </button>
          <button
            className={`admin-tab-btn ${activeTab === "stats" ? "active" : ""}`}
            onClick={() => setActiveTab("stats")}
          >
            <FaChartLine /> Thống Kê Doanh Thu
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-box">
          <FaSpinner className="spinner" /> Đang tải dữ liệu...
        </div>
      ) : (
        <>
          {/* 🌟 STATS OVERVIEW CARDS */}
          {stats && (
            <div className="admin-stats-grid">
              <div className="stat-card revenue">
                <div className="stat-icon">
                  <FaDollarSign />
                </div>
                <div>
                  <span className="stat-label">Doanh Thu Quảng Bá</span>
                  <h3>{Number(stats.totalPromotionRevenue).toLocaleString("vi-VN")} đ</h3>
                </div>
              </div>

              <div className="stat-card active">
                <div className="stat-icon">
                  <FaCheck />
                </div>
                <div>
                  <span className="stat-label">Đang Hoạt Động</span>
                  <h3>{stats.statusCounts?.ACTIVE || 0} chiến dịch</h3>
                </div>
              </div>

              <div className="stat-card pending">
                <div className="stat-icon">
                  <FaSpinner />
                </div>
                <div>
                  <span className="stat-label">Chờ Thanh Toán</span>
                  <h3>{stats.statusCounts?.PENDING_PAYMENT || 0} đơn</h3>
                </div>
              </div>

              <div className="stat-card expired">
                <div className="stat-icon">
                  <FaTimes />
                </div>
                <div>
                  <span className="stat-label">Đã Hết Hạn</span>
                  <h3>{stats.statusCounts?.EXPIRED || 0} đơn</h3>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DANH SÁCH PROMOTIONS */}
          {activeTab === "promotions" && (
            <div className="admin-card">
              <h3>Danh Sách Chiến Dịch Quảng Bá</h3>
              <div className="table-responsive">
                <table className="admin-promo-table">
                  <thead>
                    <tr>
                      <th>Sự Kiện</th>
                      <th>Ban Tổ Chức</th>
                      <th>Gói Dịch Vụ</th>
                      <th>Giá Tiền</th>
                      <th>Thời Hạn</th>
                      <th>Hiệu Lực</th>
                      <th>Trạng Thái</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotions.map((p) => (
                      <tr key={p._id}>
                        <td>
                          <strong>{p.eventId?.title || "Sự kiện"}</strong>
                        </td>
                        <td>
                          {p.organizerId?.name || p.organizerId?.email || "Organizer"}
                        </td>
                        <td>
                          <span className={`badge-type ${p.type}`}>{p.type.toUpperCase()}</span>{" "}
                          {p.planId?.name}
                        </td>
                        <td className="price-bold">
                          {Number(p.price).toLocaleString("vi-VN")} đ
                        </td>
                        <td>{p.durationDays} ngày</td>
                        <td>
                          {p.startDate ? (
                            <>
                              {new Date(p.startDate).toLocaleDateString("vi-VN")}
                              <br />
                              <small>đến {new Date(p.endDate).toLocaleDateString("vi-VN")}</small>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${p.status}`}>{p.status}</span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {p.status !== "ACTIVE" && (
                              <button
                                className="btn-action activate"
                                title="Kích hoạt"
                                onClick={() => handleUpdateStatus(p._id, "ACTIVE")}
                              >
                                Kích hoạt
                              </button>
                            )}
                            {p.status === "ACTIVE" && (
                              <button
                                className="btn-action expire"
                                title="Hết hạn"
                                onClick={() => handleUpdateStatus(p._id, "EXPIRED")}
                              >
                                Tắt
                              </button>
                            )}
                            {p.status !== "REJECTED" && (
                              <button
                                className="btn-action reject"
                                title="Từ chối"
                                onClick={() => handleUpdateStatus(p._id, "REJECTED")}
                              >
                                Từ chối
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ GÓI (PLANS CRUD) */}
          {activeTab === "plans" && (
            <div className="plans-layout">
              {/* Form tạo/sửa */}
              <div className="admin-card form-card">
                <h3>{editingPlanId ? "Sửa Gói Quảng Bá" : "Tạo Gói Quảng Bá Mới"}</h3>
                <form onSubmit={handleSavePlan}>
                  <div className="form-group">
                    <label>Tên gói</label>
                    <input
                      type="text"
                      className="admin-input"
                      required
                      value={planForm.name}
                      onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                      placeholder="VD: Top Event 14 Ngày"
                    />
                  </div>

                  <div className="form-group">
                    <label>Loại quảng bá</label>
                    <select
                      className="admin-select"
                      value={planForm.type}
                      onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
                    >
                      <option value="banner">Banner Quảng Cáo</option>
                      <option value="top">Top Event (Hàng đầu)</option>
                      <option value="featured">Featured Event (Đặc biệt)</option>
                      <option value="recommended">Recommended (Dành cho bạn)</option>
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Thời lượng (ngày)</label>
                      <input
                        type="number"
                        min="1"
                        className="admin-input"
                        required
                        value={planForm.durationDays}
                        onChange={(e) =>
                          setPlanForm({ ...planForm, durationDays: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Giá tiền (VND)</label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        className="admin-input"
                        required
                        value={planForm.price}
                        onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mô tả gói</label>
                    <textarea
                      className="admin-textarea"
                      rows="3"
                      value={planForm.description}
                      onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                      placeholder="Mô tả quyền lợi khi chọn gói này..."
                    ></textarea>
                  </div>

                  <div className="form-buttons">
                    <button type="submit" className="btn-save-plan">
                      <FaPlus /> {editingPlanId ? "Cập Nhật Gói" : "Thêm Gói Mới"}
                    </button>
                    {editingPlanId && (
                      <button
                        type="button"
                        className="btn-cancel-edit"
                        onClick={() => {
                          setEditingPlanId(null);
                          setPlanForm({
                            name: "",
                            type: "banner",
                            durationDays: 7,
                            price: 500000,
                            position: "home_banner",
                            description: "",
                          });
                        }}
                      >
                        Hủy
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Danh sách gói hiện tại */}
              <div className="admin-card list-card">
                <h3>Các Gói Đang Áp Dụng ({plans.length})</h3>
                <div className="plans-grid">
                  {plans.map((pl) => (
                    <div key={pl._id} className="admin-plan-card">
                      <div className="plan-card-head">
                        <span className={`badge-type ${pl.type}`}>{pl.type.toUpperCase()}</span>
                        <strong>{Number(pl.price).toLocaleString("vi-VN")} đ</strong>
                      </div>
                      <h4>{pl.name}</h4>
                      <p className="plan-dur">{pl.durationDays} ngày áp dụng</p>
                      <p className="plan-desc">{pl.description}</p>
                      <div className="plan-actions">
                        <button className="btn-icon edit" onClick={() => handleEditClick(pl)}>
                          <FaEdit /> Sửa
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDeletePlan(pl._id)}>
                          <FaTrash /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CHI TIẾT DOANH THU & TOP SỰ KIỆN */}
          {activeTab === "stats" && stats && (
            <div className="stats-detail-layout">
              <div className="admin-card">
                <h3>Phân Bổ Doanh Thu Theo Loại Dịch Vụ</h3>
                <div className="type-distribution-list">
                  {stats.typeDistribution?.map((t) => (
                    <div key={t._id} className="type-dist-row">
                      <span className={`badge-type ${t._id}`}>{t._id.toUpperCase()}</span>
                      <div className="dist-bar-wrap">
                        <div
                          className="dist-bar"
                          style={{
                            width: `${Math.min(
                              100,
                              (t.revenue / (stats.totalPromotionRevenue || 1)) * 100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <strong>{Number(t.revenue).toLocaleString("vi-VN")} đ</strong>
                      <span className="dist-count">({t.count} đơn)</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="admin-card">
                <h3>Top Sự Kiện Quảng Bá Nhiều Nhất</h3>
                <div className="top-events-list">
                  {stats.topPromotedEvents?.map((ev, idx) => (
                    <div key={ev._id} className="top-event-item">
                      <span className="rank-num">#{idx + 1}</span>
                      {ev.imageUrl && <img src={ev.imageUrl} alt="" className="ev-thumb" />}
                      <div className="ev-info">
                        <strong>{ev.title}</strong>
                        <span>{ev.promoCount} chiến dịch quảng bá</span>
                      </div>
                      <div className="ev-spent">
                        {Number(ev.totalSpent).toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
