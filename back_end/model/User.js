import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  studentId: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  avatar: {
      type: String,
      default: "", // link ảnh, lưu URL hoặc base64
    },
  },
  { timestamps: true }
);

// Hash password trước khi lưu
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

// So sánh mật khẩu
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

// 🧩 Fix quan trọng: chỉ định đúng collection "Users"
const User = mongoose.model("User", userSchema, "Users");
export default User;
