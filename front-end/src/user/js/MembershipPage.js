import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  getMembershipPlans,
  getMyMembership,
  createMembershipPayment,
} from "../../api/membershipApi";
import "../css/MembershipPage.css";

export default function MembershipPage() {
  const [plans, setPlans] = useState([]);
  const [myMembership, setMyMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Tải dữ liệu gói và thông tin membership của user
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const plansRes = await getMembershipPlans();
        if (plansRes?.success) {
          setPlans(plansRes.data || []);
        }

        if (token) {
          const myRes = await getMyMembership(token);
          if (myRes?.success) {
            setMyMembership(myRes.data);
          }
        }
      } catch (err) {
        console.error("Lỗi tải thông tin hội viên:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Xử lý mua gói
  const handlePurchase = async (planName) => {
    if (!token || !user) {
      Swal.fire({
        icon: "warning",
        title: "Yêu cầu đăng nhập",
        text: "Vui lòng đăng nhập tài khoản TicketNow để đăng ký gói hội viên!",
        background: "#141824",
        color: "#e2e8f0",
        confirmButtonColor: "#00E599",
        confirmButtonText: "Đã hiểu",
      });
      return;
    }

    try {
      setPurchasing(true);

      Swal.fire({
        title: "Đang tạo liên kết thanh toán...",
        text: "Vui lòng chờ trong giây lát kết nối tới cổng PayOS",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
        background: "#141824",
        color: "#e2e8f0",
      });

      const res = await createMembershipPayment(planName, token);

      if (res?.success && res?.checkoutUrl) {
        Swal.close();
        window.location.href = res.checkoutUrl;
      } else {
        Swal.fire({
          icon: "error",
          title: "Không thể tạo thanh toán",
          text: res?.message || "Đã xảy ra lỗi khi tạo thanh toán.",
          background: "#141824",
          color: "#e2e8f0",
          confirmButtonColor: "#00E599",
        });
      }
    } catch (err) {
      console.error("Lỗi khi mua gói:", err);
      Swal.fire({
        icon: "error",
        title: "Lỗi kết nối",
        text: err?.response?.data?.message || "Không thể kết nối đến máy chủ thanh toán.",
        background: "#141824",
        color: "#e2e8f0",
        confirmButtonColor: "#00E599",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const currentPlanName = myMembership?.planName || "FREE";
  const isPaidMember = myMembership?.isPaid;

  return (
    <div className="membership-page">
      <div className="membership-container">
        {/* Header Section */}
        <div className="membership-header">
          <div className="membership-badge-tag">
            <span>✨</span> TicketNow Privilege Club
          </div>
          <h1 className="membership-title">
            Nâng cấp trải nghiệm với <span>Gói Hội Viên</span>
          </h1>
          <p className="membership-subtitle">
            Trải nghiệm đặc quyền mua vé sớm (Early Access), giảm giá phí dịch vụ,
            nhận voucher hàng tháng và quyền tham gia các sự kiện độc quyền.
          </p>
        </div>

        {/* Current Active Status Banner (nếu đã đăng nhập) */}
        {user && myMembership && (
          <div className="current-status-card">
            <div className="current-status-info">
              <div
                className="status-badge-icon"
                style={{
                  color: myMembership.badgeColor || "#00E599",
                  borderColor: myMembership.badgeColor || "rgba(0, 229, 153, 0.3)",
                }}
              >
                {currentPlanName === "VIP"
                  ? "👑"
                  : currentPlanName === "PREMIUM"
                  ? "⭐"
                  : "🎟️"}
              </div>
              <div className="status-meta">
                <h4>
                  Gói hiện tại: {myMembership.displayName || currentPlanName}
                  <span className="status-tag active">
                    {isPaidMember ? "Đang kích hoạt" : "Mặc định"}
                  </span>
                </h4>
                <p>
                  {isPaidMember
                    ? `Áp dụng giảm ${myMembership.discountPercent}% phí dịch vụ và mua sớm ${myMembership.earlyAccessMinutes} phút.`
                    : "Bạn đang sử dụng gói hội viên cơ bản miễn phí."}
                </p>
              </div>
            </div>

            {isPaidMember && (
              <div className="current-status-stats">
                <div className="status-stat-item">
                  <div className="status-stat-label">Ngày kích hoạt</div>
                  <div className="status-stat-val">
                    {new Date(myMembership.startDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="status-stat-item">
                  <div className="status-stat-label">Ngày hết hạn</div>
                  <div className="status-stat-val">
                    {new Date(myMembership.endDate).toLocaleDateString("vi-VN")}
                  </div>
                </div>
                <div className="status-stat-item">
                  <div className="status-stat-label">Thời gian còn lại</div>
                  <div className="status-stat-val highlight">
                    {myMembership.daysRemaining != null
                      ? `${myMembership.daysRemaining} ngày`
                      : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Plans Grid */}
        {loading ? (
          <div style={{ textAlign: "center", color: "#00E599", padding: "60px 0" }}>
            ⏳ Đang tải các gói hội viên...
          </div>
        ) : (
          <div className="membership-grid">
            {/* GÓI 1: FREE */}
            <div className="plan-card free">
              <div className="plan-header">
                <div className="plan-icon-wrapper">🎟️</div>
                <h3 className="plan-name">FREE</h3>
                <p className="plan-desc">Quyền lợi cơ bản cho tất cả người dùng.</p>
              </div>

              <div className="plan-price-wrap">
                <span className="plan-price">0</span>
                <span className="plan-currency">VND</span>
                <span className="plan-period">/mãi mãi</span>
              </div>

              <ul className="plan-features">
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span> Mua vé các sự kiện công khai
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span> Phí dịch vụ tiêu chuẩn
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span> Lưu sự kiện yêu thích
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span> Nhận vé điện tử và QR Check-in
                </li>
              </ul>

              <button className="plan-action-btn btn-free" disabled>
                {currentPlanName === "FREE" ? "✓ Gói mặc định" : "Gói cơ bản"}
              </button>
            </div>

            {/* GÓI 2: PREMIUM */}
            <div className="plan-card premium">
              <div className="plan-ribbon">⭐ Được yêu thích nhất</div>
              <div className="plan-header">
                <div className="plan-icon-wrapper">⭐</div>
                <h3 className="plan-name">PREMIUM</h3>
                <p className="plan-desc">
                  Dành cho người yêu âm nhạc và thường xuyên tham gia sự kiện.
                </p>
              </div>

              <div className="plan-price-wrap">
                <span className="plan-price">
                  {plans.find((p) => p.name === "PREMIUM")?.price?.toLocaleString() || "49,000"}
                </span>
                <span className="plan-currency">VND</span>
                <span className="plan-period">/tháng</span>
              </div>

              <ul className="plan-features">
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  <b>Early Access:</b> Mua vé sớm hơn 15 phút
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  <b>Giảm 5% phí dịch vụ</b> khi mua vé
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  Nhận <b>2 voucher</b> ưu đãi mỗi tháng
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  Tham gia <b>Member-only Events</b>
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  Nhận thông báo mở bán sớm nhất
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  Huy hiệu <b>Premium ⭐</b> trên hồ sơ
                </li>
              </ul>

              {currentPlanName === "PREMIUM" && isPaidMember ? (
                <button className="plan-action-btn btn-current" disabled>
                  ✓ Đang sử dụng
                </button>
              ) : currentPlanName === "VIP" && isPaidMember ? (
                <button className="plan-action-btn btn-free" disabled>
                  Đã có gói VIP cao hơn
                </button>
              ) : (
                <button
                  className="plan-action-btn btn-premium"
                  onClick={() => handlePurchase("PREMIUM")}
                  disabled={purchasing}
                >
                  🚀 Đăng ký Premium
                </button>
              )}
            </div>

            {/* GÓI 3: VIP */}
            <div className="plan-card vip">
              <div className="plan-ribbon vip-ribbon">👑 Đẳng cấp thượng lưu</div>
              <div className="plan-header">
                <div className="plan-icon-wrapper">👑</div>
                <h3 className="plan-name">VIP</h3>
                <p className="plan-desc">
                  Trọn vẹn quyền lợi đặc quyền tối cao và ưu tiên hàng đầu.
                </p>
              </div>

              <div className="plan-price-wrap">
                <span className="plan-price">
                  {plans.find((p) => p.name === "VIP")?.price?.toLocaleString() || "99,000"}
                </span>
                <span className="plan-currency">VND</span>
                <span className="plan-period">/tháng</span>
              </div>

              <ul className="plan-features">
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  <b>Early Access:</b> Mua vé sớm hơn 30 phút
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  <b>Giảm 10% phí dịch vụ</b> khi mua vé
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  Nhận <b>5 voucher</b> ưu đãi mỗi tháng
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  Tham gia <b>VIP / Member-only Events</b>
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  <b>Priority Support:</b> Ưu tiên hỗ trợ 24/7
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  Thông báo sự kiện sớm & Ưu đãi sinh nhật
                </li>
                <li className="plan-feature-item">
                  <span className="feature-check">✓</span>
                  Huy hiệu <b>VIP 👑</b> hoàng gia trên hồ sơ
                </li>
              </ul>

              {currentPlanName === "VIP" && isPaidMember ? (
                <button className="plan-action-btn btn-current" disabled>
                  👑 Đang sử dụng đặc quyền VIP
                </button>
              ) : (
                <button
                  className="plan-action-btn btn-vip"
                  onClick={() => handlePurchase("VIP")}
                  disabled={purchasing}
                >
                  {currentPlanName === "PREMIUM" && isPaidMember
                    ? "✨ Nâng cấp lên VIP"
                    : "👑 Đăng ký VIP"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Benefits Highlights Section */}
        <div className="membership-perks-section">
          <div className="perks-header">
            <h3>Quyền lợi độc quyền của Hội viên TicketNow</h3>
            <p style={{ color: "#94a3b8" }}>
              Những lợi ích thiết thực giúp bạn không bao giờ bỏ lỡ sự kiện yêu thích
            </p>
          </div>

          <div className="perks-grid">
            <div className="perk-item">
              <div className="perk-icon">⏱️</div>
              <h4>Early Access (Mua vé sớm)</h4>
              <p>
                Tránh tình trạng hết vé với các sự kiện hot! Hội viên VIP được mua trước
                30 phút, Premium được mua trước 15 phút so với công chúng.
              </p>
            </div>

            <div className="perk-item">
              <div className="perk-icon">💸</div>
              <h4>Tiết kiệm phí dịch vụ</h4>
              <p>
                Giảm ngay 5% (Premium) hoặc 10% (VIP) phí dịch vụ trên từng giao dịch mua
                vé. Mua càng nhiều, tiết kiệm càng lớn!
              </p>
            </div>

            <div className="perk-item">
              <div className="perk-icon">🔥</div>
              <h4>Sự kiện Member-Only</h4>
              <p>
                Quyền truy cập độc quyền các sự kiện chỉ dành riêng cho hội viên hoặc
                suất diễn giới hạn mà người dùng thường không thể mua.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
