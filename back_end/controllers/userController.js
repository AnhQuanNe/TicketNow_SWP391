import User from "../model/User.js";
import multer from "multer";
import path from "path";
import dayjs from "dayjs";

// 🧩 Cấu hình nơi lưu file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 📁 thư mục gốc để lưu ảnh
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
    console.error("❌ getUserById error:", err);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại." });
  }
};

// 🔹 Cập nhật thông tin người dùng (tên, số điện thoại, ngày sinh, giới tính, studentId)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // ❌ Không cho đổi email
    if (req.body.email) delete req.body.email;

    // ✅ Cập nhật tên
    if (req.body.name) user.name = req.body.name;

    // ✅ Kiểm tra & cập nhật số điện thoại
    if (req.body.phone) {
      if (!/^[0-9]{10}$/.test(req.body.phone)) {
        return res
          .status(400)
          .json({ message: "Số điện thoại phải gồm đúng 10 chữ số!" });
      }

      const phoneExist = await User.findOne({
        phone: req.body.phone,
        _id: { $ne: user._id },
      });

      if (phoneExist) {
        return res.status(400).json({ message: "Số điện thoại đã tồn tại!" });
      }

      user.phone = req.body.phone;
    }

    // ✅ Kiểm tra ngày sinh hợp lệ (≥18 tuổi)
    if (req.body.dob) {
      const birthDate = dayjs(req.body.dob);
      const age = dayjs().diff(birthDate, "year");

      if (age < 18) {
        return res
          .status(400)
          .json({ message: "Người dùng phải đủ 18 tuổi trở lên!" });
      }

      user.dob = req.body.dob;
    }

    // ✅ Cập nhật giới tính
    if (req.body.gender) user.gender = req.body.gender;

    // ✅ Avatar có thể cập nhật bằng URL string
    if (req.body.avatar) user.avatar = req.body.avatar;

    // ✅ studentId chỉ cho nhập 1 lần
    if (!user.studentId && req.body.studentId) {
      user.studentId = req.body.studentId;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    console.error("❌ updateUser error:", err);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại." });
  }
};

// 🔹 Upload & cập nhật ảnh đại diện (API riêng)
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Không có file ảnh nào được tải lên!" });
    }

    const avatarPath = `/uploads/${req.file.filename}`; // đường dẫn để frontend hiển thị
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
    console.error("❌ updateAvatar error:", err);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại." });
  }
};
