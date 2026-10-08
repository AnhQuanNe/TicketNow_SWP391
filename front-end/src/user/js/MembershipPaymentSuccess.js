import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { verifyMembershipPayment } from "../../api/membershipApi";

export default function MembershipPaymentSuccess() {
  const navigate = useNavigate();
  const hasRun = useRef(false);
  const [verifying, setVerifying] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const verify = async () => {
      const params = new URLSearchParams(window.location.search);
      const status = params.get("status");
      const orderCode = params.get("orderCode");
      const token = localStorage.getItem("token");

      if (status !== "PAID") {
        Swal.fire({
          icon: "error",
          title: "Thanh toán chưa hoàn tất",
          text: "Giao dịch đăng ký hội viên của bạn chưa hoàn tất hoặc đã bị hủy.",
          background: "#141824",
          color: "#e2e8f0",
          confirmButtonColor: "#00E599",
        }).then(() => {
          navigate("/membership");
        });
        return;
      }

      if (!orderCode) {
        Swal.fire({
          icon: "warning",
          title: "Thiếu mã đơn hàng",
          text: "Không tìm thấy mã đơn hàng để xác nhận thanh toán.",
          background: "#141824",
          color: "#e2e8f0",
        }).then(() => {
          navigate("/membership");
        });
        return;
      }

      try {
        setVerifying(true);
        const res = await verifyMembershipPayment(orderCode, token);

        if (res?.success) {
          Swal.fire({
            icon: "success",
            title: "🎉 Kích hoạt thành công!",
            text: res.message || "Gói hội viên của bạn đã được kích hoạt thành công!",
            background: "#141824",
            color: "#e2e8f0",
            confirmButtonColor: "#00E599",
            confirmButtonText: "Khám phá ngay",
          }).then(() => {
            navigate("/membership");
          });
        } else {
          setErrorMsg(res?.message || "Không thể xác nhận thanh toán với cổng PayOS.");
          Swal.fire({
            icon: "error",
            title: "Xác nhận thất bại",
            text: res?.message || "Không thể xác thực giao dịch.",
            background: "#141824",
            color: "#e2e8f0",
          }).then(() => {
            navigate("/membership");
          });
        }
      } catch (err) {
        console.error("Lỗi xác nhận membership:", err);
        setErrorMsg(err?.response?.data?.message || "Lỗi hệ thống khi kích hoạt gói.");
        Swal.fire({
          icon: "error",
          title: "Lỗi kích hoạt",
          text: err?.response?.data?.message || "Có lỗi xảy ra khi kích hoạt gói hội viên.",
          background: "#141824",
          color: "#e2e8f0",
        }).then(() => {
          navigate("/membership");
        });
      } finally {
        setVerifying(false);
      }
    };

    verify();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "80vh",
        background: "#0b0d13",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#e2e8f0",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#141824",
          padding: "40px",
          borderRadius: "20px",
          textAlign: "center",
          maxWidth: "480px",
          width: "100%",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
          {verifying ? "⏳" : errorMsg ? "❌" : "🎉"}
        </div>
        <h2 style={{ color: "#ffffff", marginBottom: "12px", fontSize: "1.6rem" }}>
          {verifying
            ? "Đang xác thực thanh toán..."
            : errorMsg
            ? "Xác thực thất bại"
            : "Kích hoạt thành công!"}
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "0.95rem", lineHeight: "1.6" }}>
          {verifying
            ? "Hệ thống đang kết nối với PayOS để kiểm tra và kích hoạt đặc quyền gói hội viên cho bạn..."
            : errorMsg || "Đang chuyển hướng về trang hội viên..."}
        </p>
      </div>
    </div>
  );
}
