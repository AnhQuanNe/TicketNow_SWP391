import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Đang xác thực tài khoản...");

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/auth/verify-email/${token}`
        );
        const data = await res.json();

        console.log("VERIFY RESPONSE", data); // Kiểm tra

        if (res.ok) {
          setMessage("🎉 Kích hoạt thành công! Đang đăng nhập...");

          // 🟢 Lưu đúng key để Header đọc được
          localStorage.setItem(
            "user",
            JSON.stringify({
              token: data.token,
              ...data.user,
            })
          );

          localStorage.setItem("token", data.token);

          // Reload trang để Header load user mới
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
        } else {
          setMessage(data.message || "Token không hợp lệ hoặc đã hết hạn.");
        }
      } catch (err) {
        setMessage("Lỗi kết nối server.");
      }
    };

    verify();
  }, [token]);

  return (
    <div style={{ textAlign: "center", marginTop: "80px", fontSize: "20px" }}>
      {message}
    </div>
  );
}
