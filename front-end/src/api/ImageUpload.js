import React, { useState } from "react";

function ImageUpload() {
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "ticketnow_upload"); // preset Cloudinary
    formData.append("cloud_name", "duh7umnxa"); // cloud name của bạn

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/duh7umnxa/image/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setImageUrl(data.secure_url);
      setLoading(false);
    } catch (err) {
      console.error("Upload error:", err);
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h3>Upload ảnh lên Cloudinary</h3>
      <input type="file" accept="image/*" onChange={handleUpload} />

      {loading && <p>Đang tải ảnh lên...</p>}

      {imageUrl && (
        <div style={{ marginTop: "20px" }}>
          <p>Ảnh của bạn:</p>
          <img src={imageUrl} alt="Uploaded" width="300" />
          <p><strong>URL:</strong> {imageUrl}</p>
        </div>
      )}
    </div>
  );
}

export default ImageUpload;
