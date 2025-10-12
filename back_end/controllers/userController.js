import User from "../model/User.js";
import multer from "multer";
import path from "path";

// 🧩 Cấu hình nơi lưu file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 📁 thư mục gốc trong backend
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// ✅ Middleware upload (chỉ nhận 1 file tên 'avatar')
export const upload = multer({ storage });

// 🔹 Lấy thông tin người dùng theo ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Cập nhật thông tin người dùng (name, studentId, avatar dạng string)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ❌ Không cho sửa email & phone
    if (req.body.email) delete req.body.email;
    if (req.body.phone) delete req.body.phone;

    // 🔒 Không cho đổi studentId nếu đã có
    if (user.studentId && req.body.studentId && req.body.studentId !== user.studentId) {
      delete req.body.studentId;
    }

    // ✅ Cho phép đổi name & avatar vô hạn lần
    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;

    // ✅ Nếu chưa có studentId thì cho nhập 1 lần
    if (!user.studentId && req.body.studentId) {
      user.studentId = req.body.studentId;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔹 Upload & cập nhật ảnh đại diện (API riêng)
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) {
      return res.status(400).json({ message: "Không có file ảnh nào được tải lên!" });
    }

    const avatarPath = `/uploads/${req.file.filename}`; // đường dẫn ảnh để frontend hiển thị

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarPath },
      { new: true }
    ).select("-passwordHash");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "✅ Cập nhật ảnh đại diện thành công!",
      avatar: updatedUser.avatar,
    });
  } catch (err) {
    console.error("❌ Lỗi cập nhật avatar:", err);
    res.status(500).json({ message: err.message });
  }
};
