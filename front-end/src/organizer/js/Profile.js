import React, { useEffect, useState } from "react";
import { getOrganizerProfile, updateOrganizerProfile } from "../../api/organizerApi";
import "../../organizer/css/Profile.css";

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getOrganizerProfile(token);

        if (data.message === "not_found") {
          setProfile(null);
          setError("Chưa có hồ sơ Organizer. Hãy cập nhật thông tin của bạn.");
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("❌ Lỗi khi tải hồ sơ Organizer:", err);
        setError("Không thể tải hồ sơ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (e) => {
    if (!profile) return;
    const { name, value } = e.target;

    // 🟢 Xử lý riêng cho socialLinks
    if (name === "facebook" || name === "website") {
      setProfile({
        ...profile,
        socialLinks: {
          ...profile.socialLinks,
          [name]: value,
        },
      });
    } else {
      setProfile({ ...profile, [name]: value });
    }
  };

  const handleSave = async () => {
    try {
      if (!profile) return alert("Không có dữ liệu để cập nhật!");
      const updated = await updateOrganizerProfile(token, profile);
      setProfile(updated);
      alert("✅ Cập nhật hồ sơ thành công!");
    } catch (err) {
      console.error("❌ Lỗi cập nhật:", err);
      alert("Lỗi cập nhật hồ sơ!");
    }
  };

  if (loading) return <p>Đang tải...</p>;

  if (!profile)
    return (
      <div className="profile-container">
        <h2>Hồ sơ Organizer</h2>
        <p style={{ color: "gray" }}>{error}</p>
        <p>Bạn có thể trở thành Organizer bằng cách tạo hồ sơ tại đây sau này.</p>
      </div>
    );

  // 🟢 Nếu có dữ liệu organizer
  return (
    <div className="profile-container">
      <h2>Hồ sơ Organizer</h2>

      <label>Tên tổ chức:</label>
      <input
        name="organizationName"
        value={profile.organizationName || ""}
        onChange={handleChange}
      />

      <label>Giới thiệu:</label>
      <textarea
        name="description"
        value={profile.description || ""}
        onChange={handleChange}
        rows={4}
      />

      <label>Số điện thoại:</label>
      <input
        name="contactPhone"
        value={profile.contactPhone || ""}
        onChange={handleChange}
      />

      <label>Địa chỉ:</label>
      <input
        name="address"
        value={profile.address || ""}
        onChange={handleChange}
      />

      <label>Facebook:</label>
      <input
        name="facebook"
        value={profile.socialLinks?.facebook || ""}
        onChange={handleChange}
      />

      <label>Website:</label>
      <input
        name="website"
        value={profile.socialLinks?.website || ""}
        onChange={handleChange}
      />

      <button onClick={handleSave}>💾 Lưu thay đổi</button>
    </div>
  );
}

export default Profile;
