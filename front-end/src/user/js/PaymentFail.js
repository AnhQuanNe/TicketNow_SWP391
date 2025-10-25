import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

function PaymentFail() {
  const navigate = useNavigate();

  useEffect(() => {
    Swal.fire({
      icon: "error",
      title: "Thanh toán thất bại 😢",
      text: "Giao dịch của bạn không thành công. Vui lòng thử lại!",
      confirmButtonColor: "#e60073",
    }).then(() => {
      navigate("/"); // quay về trang chủ sau khi đóng thông báo
    });
  }, [navigate]);

  return (
    <div
      style={{
        padding: "50px",
        textAlign: "center",
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <h2 style={{ color: "#e60073" }}>❌ Thanh toán thất bại</h2>
      <p>Đang chuyển bạn về trang chủ...</p>
    </div>
  );
}

export default PaymentFail;
