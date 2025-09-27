const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // ví dụ: "role_admin", "role_user", "role_organizer"
      required: true,
      trim: true,
    },
    name: {
      type: String, // ví dụ: "admin", "user", "organizer"
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
    },
  },
  {
    collection: "Roles",   // đảm bảo collection trong MongoDB tên là "roles"
    versionKey: false,     // tắt __v
    timestamps: false,     // không cần createdAt, updatedAt cho bảng role
  }
);

// Xuất model
module.exports = mongoose.model("Role", roleSchema);
