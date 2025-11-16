import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: false, default: null }, // ✅ cho phép rỗng
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local", // ✅ để phân biệt tài khoản thường và tài khoản Google
    },
    phone: { type: String, unique: true, sparse: true },
    studentId: { type: String, unique: true, sparse: true },
    createdAt: { type: Date, default: Date.now },
    avatar: {
      type: String,
      default: "", // link ảnh, lưu URL hoặc base64
    },
    dob: { type: String, default: "" },
    gender: { type: String, default: "" },
    // 🟢 Vai trò của người dùng (liên kết tới bảng Roles)
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },

    // 🧡 [THÊM NGAY DƯỚI ĐÂY]
    // Danh sách sự kiện yêu thích của user
    favoriteEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event", // tham chiếu tới model Event
      },
    ],
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: "" },

    // 🧡 [HẾT PHẦN THÊM MỚI]
    resetOTP: { type: String, default: null },
    resetOTPExpire: { type: Date, default: null },
  },
  { timestamps: true }
);

// ✅ Loại bỏ studentId null/empty để không lỗi unique
userSchema.pre("save", function (next) {
  if (!this.studentId || this.studentId === "") {
    this.studentId = undefined;
  }
  next();
});

// ✅ Khi update cũng xử lý tương tự
userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update && (update.studentId === null || update.studentId === "")) {
    delete update.studentId;
    this.setUpdate(update);
  }
  next();
});

// ✅ Hash password nếu có (user local)
userSchema.pre("save", async function (next) {
  if (!this.passwordHash || !this.isModified("passwordHash")) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// ✅ So sánh mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.passwordHash) return false; // user Google thì không có mật khẩu
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};
// Helper: lấy tên role (populate nhẹ nếu cần)
userSchema.methods.getRoleName = async function () {
  if (!this.roleId) return "user";
  const roleDoc = await mongoose.model("Role").findById(this.roleId).lean();
  return roleDoc?.name || "user";
};

// 🧩 Chỉ định đúng collection "Users"
const User = mongoose.model("User", userSchema, "Users");
export default User;
