import React, { useEffect, useState } from "react";
import "../css/Profile.css"
export default function Profile({ organizerId }) {
  const [organizer, setOrganizer] = useState(null);

// useEffect(() => {
  //  fetch(`http://localhost:5000/api/organizers/${organizerId}`)
    //  .then((res) => res.json())
      //.then((data) => setOrganizer(data))
      //.catch((err) => console.error("Lỗi fetch:", err));
 // }, [organizerId]);

 useEffect(() => {
    // Tạo dữ liệu giả lập
    const mockOrganizer = {
      id: "org_clb_vannghe",
      name: "CLB Văn Nghệ FPT",
      description: "Câu lạc bộ văn nghệ tổ chức các chương trình ca nhạc và giao lưu văn hóa.",
      contactEmail: "clbvannghe@fpt.edu.vn",
      phone: "0909876543",
      logoUrl: "https://example.com/logo-clb-van-nghe.png",
      locationId: "loc_innovation",
      isActive: true
    };

    // Giả lập delay giống fetch
    setTimeout(() => setOrganizer(mockOrganizer), 500);
  }, []);

  if (!organizer) {
    return <div>Đang tải thông tin tổ chức...</div>;
  }

  return (
    <div className="organizer-profile">
      <h2>Thông tin tổ chức</h2>
      <div className="profile-card">
      <img src={organizer.logoUrl} alt={organizer.name} width={100} />
        <p><strong>Tên tổ chức:</strong> {organizer.name}</p>
        <p><strong>Email:</strong> {organizer.contactEmail}</p>
        <p><strong>Số điện thoại:</strong> {organizer.phone}</p>
        <p><strong>Địa chỉ:</strong> {organizer.locationId}</p>
        <p><strong>Mô tả:</strong> {organizer.description}</p>
      </div>
    </div>
  );
}
