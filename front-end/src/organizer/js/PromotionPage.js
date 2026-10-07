import React, { useState, useEffect } from "react";
import {
  getMyEventsForPromotion,
  getPromotionPlans,
  createPromotionOrder,
  verifyPromotionPayment,
  getMyPromotions,
} from "../../api/promotionApi";
import {
  FaBullhorn,
  FaCrown,
  FaStar,
  FaImage,
  FaThumbsUp,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaHistory,
  FaPlusCircle,
  FaExternalLinkAlt,
  FaSpinner,
} from "react-icons/fa";
import "../css/PromotionPage.css";

export default function PromotionPage() {
  const [activeTab, setActiveTab] = useState("create"); // "create" | "history"
  const [events, setEvents] = useState([]);
  const [plans, setPlans] = useState([]);
  const [myPromotions, setMyPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Form selection state
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedType, setSelectedType] = useState("banner"); // "banner" | "top" | "featured" | "recommended"
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [customBannerUrl, setCustomBannerUrl] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");

  // Load initial data
  useEffect(() => {
    loadData();
    checkUrlPaymentCallback();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, plansRes, myPromosRes] = await Promise.all([
        getMyEventsForPromotion().catch(() => ({ data: [] })),
        getPromotionPlans().catch(() => ({ data: [] })),
        getMyPromotions().catch(() => ({ data: [] })),
      ]);

      const evList = eventsRes.data || [];
      const planList = plansRes.data || [];
      const myPromoList = myPromosRes.data || [];

      setEvents(evList);
      setPlans(planList);
      setMyPromotions(myPromoList);

      if (evList.length > 0) setSelectedEventId(evList[0]._id);
      
      // Mặc định chọn plan đầu tiên của loại banner
      const bannerPlans = planList.filter((p) => p.type === "banner");
      if (bannerPlans.length > 0) setSelectedPlanId(bannerPlans[0]._id);
    } catch (err) {
      console.error("Lỗi tải dữ liệu quảng bá:", err);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra callback thanh toán từ PayOS
  const checkUrlPaymentCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const orderCode = params.get("orderCode");
    const payment = params.get("payment");

    if (orderCode && payment === "success") {
      try {
        const verifyRes = await verifyPromotionPayment(orderCode);
        if (verifyRes.success) {
          setStatusMessage({
            type: "success",
            text: "🎉 Thanh toán thành công! Gói quảng bá của bạn đã được kích hoạt ngay lập tức.",
          });
          setActiveTab("history");
        } else {
          setStatusMessage({
            type: "warning",
            text: "Giao dịch đang chờ xử lý từ ngân hàng hoặc chưa hoàn tất.",
          });
        }
      } catch (err) {
        setStatusMessage({
          type: "error",
          text: "Không thể xác thực giao dịch: " + err.message,
        });
      }
    } else if (orderCode && payment === "cancel") {
      setStatusMessage({
        type: "info",
        text: "Bạn đã hủy quá trình thanh toán gói quảng bá.",
      });
    }
  };

  // Cập nhật selectedPlanId khi đổi type
  const handleTypeChange = (type) => {
    setSelectedType(type);
    const availablePlans = plans.filter((p) => p.type === type);
    if (availablePlans.length > 0) {
      setSelectedPlanId(availablePlans[0]._id);
    } else {
      setSelectedPlanId("");
    }
  };

  const selectedPlan = plans.find((p) => p._id === selectedPlanId);
  const selectedEvent = events.find((e) => e._id === selectedEventId);

  // Gửi tạo đơn thanh toán PayOS
  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !selectedPlanId) {
      alert("Vui lòng chọn sự kiện và gói quảng bá phù hợp!");
      return;
    }

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        eventId: selectedEventId,
        planId: selectedPlanId,
        customBannerUrl: customBannerUrl || selectedEvent?.imageUrl,
        bannerTitle: bannerTitle || selectedEvent?.title,
        bannerPosition: selectedPlan?.position || "home_banner",
      };

      const res = await createPromotionOrder(payload);

      if (res.success && res.checkoutUrl) {
        // Chuyển hướng sang PayOS checkout
        window.location.href = res.checkoutUrl;
      } else {
        alert(res.message || "Không thể tạo liên kết thanh toán");
      }
    } catch (err) {
      console.error("Lỗi tạo đơn:", err);
      alert(err.response?.data?.message || err.message || "Lỗi hệ thống");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return <span className="badge-promo active">Đang hoạt động</span>;
      case "PENDING_PAYMENT":
        return <span className="badge-promo pending">Chờ thanh toán</span>;
      case "EXPIRED":
        return <span className="badge-promo expired">Đã hết hạn</span>;
      case "REJECTED":
        return <span className="badge-promo rejected">Bị từ chối</span>;
      default:
        return <span className="badge-promo">{status}</span>;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "banner":
        return <FaImage className="type-icon banner" />;
      case "top":
        return <FaCrown className="type-icon top" />;
      case "featured":
        return <FaStar className="type-icon featured" />;
      case "recommended":
        return <FaThumbsUp className="type-icon recommended" />;
      default:
        return <FaBullhorn className="type-icon" />;
    }
  };

  return (
    <div className="promotion-page-container">
      {/* Header section */}
      <div className="promo-header">
        <div>
          <h1 className="promo-title">
            <FaBullhorn /> Dịch Vụ Quảng Bá Sự Kiện
          </h1>
          <p className="promo-subtitle">
            Tiếp cận hàng nghìn khách hàng tiềm năng, đưa sự kiện lên vị trí dẫn đầu TicketNow.
          </p>
        </div>

        {/* Tab switch */}
        <div className="promo-tabs">
          <button
            className={`promo-tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <FaPlusCircle /> Đăng Ký Quảng Bá
          </button>
          <button
            className={`promo-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("history");
              loadData();
            }}
          >
            <FaHistory /> Lịch Sử & Trạng Thái ({myPromotions.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`promo-alert ${statusMessage.type}`}>
          {statusMessage.text}
        </div>
      )}

      {loading ? (
        <div className="promo-loading">
          <FaSpinner className="spinner-icon" /> Đang tải thông tin gói quảng bá...
        </div>
      ) : activeTab === "create" ? (
        <div className="promo-create-layout">
          {/* CỘT TRÁI: FORM CHỌN GÓI */}
          <div className="promo-form-card">
            {events.length === 0 ? (
              <div className="no-events-notice">
                <p>Bạn chưa có sự kiện nào đang hoạt động để quảng bá.</p>
                <a href="/organizer" className="btn-create-event">
                  + Tạo sự kiện mới ngay
                </a>
              </div>
            ) : (
              <form onSubmit={handleCreateOrder}>
                {/* 1. CHỌN SỰ KIỆN */}
                <div className="form-group-promo">
                  <label className="promo-label">1. Chọn sự kiện cần quảng bá</label>
                  <select
                    className="promo-select"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    required
                  >
                    {events.map((ev) => (
                      <option key={ev._id} value={ev._id}>
                        {ev.title} {ev.isPendingApproval ? "⏳ (Chờ Admin duyệt)" : "✅ (Đã duyệt)"} {ev.date ? `— ${new Date(ev.date).toLocaleDateString("vi-VN")}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedEvent?.isPendingApproval && (
                    <div
                      style={{
                        background: "rgba(245, 158, 11, 0.12)",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        borderRadius: 10,
                        padding: "10px 14px",
                        marginTop: 10,
                        color: "#f59e0b",
                        fontSize: 13,
                        lineHeight: 1.5,
                      }}
                    >
                      ℹ️ <strong>Sự kiện đang chờ Admin duyệt:</strong> Bạn vẫn có thể đăng ký và thanh toán gói quảng bá trước. Banner và vị trí ưu tiên sẽ tự động kích hoạt ngay khi Admin duyệt sự kiện!
                    </div>
                  )}
                </div>

                {/* 2. CHỌN HÌNH THỨC QUẢNG BÁ */}
                <div className="form-group-promo">
                  <label className="promo-label">2. Chọn hình thức quảng bá</label>
                  <div className="promo-type-grid">
                    <div
                      className={`type-card ${selectedType === "banner" ? "active" : ""}`}
                      onClick={() => handleTypeChange("banner")}
                    >
                      <FaImage className="card-type-icon" />
                      <h4>Banner Nổi Bật</h4>
                      <p>Xuất hiện ở vị trí Banner lớn trang chủ & listing</p>
                    </div>

                    <div
                      className={`type-card ${selectedType === "top" ? "active" : ""}`}
                      onClick={() => handleTypeChange("top")}
                    >
                      <FaCrown className="card-type-icon" />
                      <h4>Top Event</h4>
                      <p>Ưu tiên xếp số 1 ở hàng sự kiện đầu trang chủ</p>
                    </div>

                    <div
                      className={`type-card ${selectedType === "featured" ? "active" : ""}`}
                      onClick={() => handleTypeChange("featured")}
                    >
                      <FaStar className="card-type-icon" />
                      <h4>Featured Event</h4>
                      <p>Được đưa vào khu vực 'Sự kiện đặc biệt' nổi bật</p>
                    </div>

                    <div
                      className={`type-card ${selectedType === "recommended" ? "active" : ""}`}
                      onClick={() => handleTypeChange("recommended")}
                    >
                      <FaThumbsUp className="card-type-icon" />
                      <h4>Recommended</h4>
                      <p>Thuật toán ưu tiên gợi ý trong mục 'Dành cho bạn'</p>
                    </div>
                  </div>
                </div>

                {/* 3. CHỌN THỜI HẠN GÓI */}
                <div className="form-group-promo">
                  <label className="promo-label">3. Chọn thời hạn gói</label>
                  <div className="promo-plan-list">
                    {plans
                      .filter((p) => p.type === selectedType)
                      .map((plan) => (
                        <div
                          key={plan._id}
                          className={`plan-item ${selectedPlanId === plan._id ? "selected" : ""}`}
                          onClick={() => setSelectedPlanId(plan._id)}
                        >
                          <div className="plan-info">
                            <strong>{plan.name}</strong>
                            <span>{plan.description}</span>
                          </div>
                          <div className="plan-price">
                            <span className="price-tag">
                              {Number(plan.price).toLocaleString("vi-VN")} đ
                            </span>
                            <span className="duration-tag">{plan.durationDays} ngày</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 4. TÙY CHỌN BANNER NẾU LÀ LOẠI BANNER */}
                {selectedType === "banner" && (
                  <div className="banner-custom-box">
                    <label className="promo-label">Tùy biến Banner (Tùy chọn)</label>
                    <input
                      type="text"
                      className="promo-input"
                      placeholder="Link ảnh banner (để trống sẽ dùng ảnh của sự kiện)"
                      value={customBannerUrl}
                      onChange={(e) => setCustomBannerUrl(e.target.value)}
                    />
                    <input
                      type="text"
                      className="promo-input"
                      style={{ marginTop: "10px" }}
                      placeholder="Tiêu đề hiển thị trên banner (để trống sẽ dùng tên sự kiện)"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                    />
                  </div>
                )}

                {/* NÚT THANH TOÁN */}
                <button
                  type="submit"
                  className="btn-submit-order"
                  disabled={submitting || !selectedPlan}
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="spinner-icon" /> Đang kết nối PayOS...
                    </>
                  ) : (
                    <>
                      <FaExternalLinkAlt /> Thanh Toán Qua Cổng PayOS (
                      {selectedPlan ? Number(selectedPlan.price).toLocaleString("vi-VN") + " đ" : "0 đ"}
                      )
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG */}
          <div className="promo-summary-card">
            <h3>Tóm Tắt Đơn Quảng Bá</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Sự kiện:</span>
                <strong>{selectedEvent?.title || "Chưa chọn"}</strong>
              </div>
              <div className="summary-row">
                <span>Hình thức:</span>
                <span className="type-badge-text">
                  {selectedType === "banner"
                    ? "Banner Quảng Cáo"
                    : selectedType === "top"
                    ? "Top Event"
                    : selectedType === "featured"
                    ? "Featured Event"
                    : "Recommended Event"}
                </span>
              </div>
              <div className="summary-row">
                <span>Thời hạn:</span>
                <strong>{selectedPlan?.durationDays || 0} Ngày</strong>
              </div>
              <div className="summary-row">
                <span>Cổng thanh toán:</span>
                <strong style={{ color: "#00E599" }}>PayOS (VietQR / Thẻ)</strong>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Tổng chi phí:</span>
                <span className="total-amount">
                  {selectedPlan ? Number(selectedPlan.price).toLocaleString("vi-VN") + " đ" : "0 đ"}
                </span>
              </div>
            </div>

            <div className="security-notice">
              <FaCheckCircle className="sec-icon" />
              <p>
                Giao dịch được bảo mật bởi PayOS. Sau khi thanh toán thành công, hệ thống sẽ tự động kích hoạt và ưu tiên hiển thị sự kiện ngay lập tức.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* TAB LỊCH SỬ & QUẢN LÝ QUẢNG BÁ */
        <div className="promo-history-card">
          {myPromotions.length === 0 ? (
            <div className="empty-history">
              <FaBullhorn className="empty-icon" />
              <h3>Chưa có chiến dịch quảng bá nào</h3>
              <p>Hãy khởi tạo gói quảng bá đầu tiên để bứt phá doanh số bán vé của bạn.</p>
              <button
                className="btn-create-event"
                onClick={() => setActiveTab("create")}
              >
                + Đăng ký gói ngay
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="promo-table">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Sự kiện</th>
                    <th>Thời lượng</th>
                    <th>Chi phí</th>
                    <th>Bắt đầu</th>
                    <th>Kết thúc</th>
                    <th>Mã đơn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {myPromotions.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="promo-type-cell">
                          {getTypeIcon(p.type)}
                          <span>
                            {p.type === "banner"
                              ? "Banner"
                              : p.type === "top"
                              ? "Top Event"
                              : p.type === "featured"
                              ? "Featured"
                              : "Recommended"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <strong>{p.eventId?.title || "Sự kiện"}</strong>
                      </td>
                      <td>{p.durationDays} ngày</td>
                      <td className="price-cell">
                        {Number(p.price).toLocaleString("vi-VN")} đ
                      </td>
                      <td>
                        {p.startDate ? new Date(p.startDate).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td>
                        {p.endDate ? new Date(p.endDate).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td>
                        <code>{p.orderCode}</code>
                      </td>
                      <td>{getStatusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
