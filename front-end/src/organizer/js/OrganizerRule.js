import React from "react";
import "../css/OrganizerRule.css";

function OrganizerRules({ onAgree }) {
  return (
    <div className="organizer-rules">
      <h2>Quy định chung dành cho Ban Tổ Chức</h2>
      <ol>
        <li>
           <strong>Trách nhiệm nội dung:</strong>  
          Ban Tổ Chức (BTC) chịu trách nhiệm hoàn toàn về tính chính xác, minh bạch của thông tin sự kiện đã đăng.
        </li>
        <li>
           <strong>Không được đăng:</strong>  
          Sự kiện mang nội dung chính trị, tôn giáo, phản cảm, bạo lực, hoặc vi phạm pháp luật Việt Nam.
        </li>
        <li>
           <strong>Thời gian sự kiện:</strong>  
          Ngày và giờ diễn ra phải hợp lệ, không được đặt trong quá khứ.  
          Nếu thay đổi, BTC phải cập nhật sớm nhất trên hệ thống.
        </li>
        <li>
           <strong>Giá vé & hoàn vé:</strong>  
          Giá vé phải rõ ràng, không gian lận. Chính sách hoàn vé phải được nêu cụ thể nếu có.
        </li>
        <li>
           <strong>Hình ảnh & truyền thông:</strong>  
          Hình ảnh, video và nội dung quảng bá phải thuộc quyền sở hữu của BTC, không vi phạm bản quyền.
        </li>
        <li>
           <strong>Liên hệ hỗ trợ:</strong>  
          BTC phải cung cấp ít nhất một kênh liên lạc (email hoặc hotline) cho khách tham dự khi cần hỗ trợ.
        </li>
        <li>
           <strong>Vi phạm quy định:</strong>  
          Sự kiện vi phạm sẽ bị gỡ bỏ mà không cần thông báo trước.  
          BTC có thể bị khóa tài khoản nếu tái phạm.
        </li>
        <li>
           <strong>Cam kết:</strong>  
          Khi nhấn “Đăng sự kiện”, BTC đồng ý tuân thủ toàn bộ các quy định trên và chịu trách nhiệm pháp lý liên quan.
        </li>
      </ol>

    </div>
  );
}

export default OrganizerRules;
