import User from "../model/User.js";
import Role from "../model/Role.js";
import multer from "multer";
import path from "path";
import dayjs from "dayjs";

// 🧩 Cấu hình nơi lưu file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});
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

// 🔹 Cập nhật thông tin người dùng
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.email) delete req.body.email;
    if (req.body.name) user.name = req.body.name;

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

    if (req.body.gender) user.gender = req.body.gender;
    if (req.body.avatar) user.avatar = req.body.avatar;

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

// 🔹 Upload & cập nhật ảnh đại diện
export const updateAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Không có file ảnh nào được tải lên!" });
    }

    const avatarPath = `/uploads/${req.file.filename}`;
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

// 🧡 Thêm/gỡ sự kiện yêu thích
export const toggleFavoriteEvent = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    if (!userId || !eventId) {
      return res.status(400).json({ message: "Thiếu userId hoặc eventId!" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isFavorite = user.favoriteEvents.includes(eventId);
    if (isFavorite) {
      user.favoriteEvents = user.favoriteEvents.filter(
        (id) => id.toString() !== eventId
      );
    } else {
      user.favoriteEvents.push(eventId);
    }

    await user.save();
    res.json({
      message: isFavorite
        ? "Đã xoá khỏi sự kiện của tôi"
        : "Đã thêm vào sự kiện của tôi",
      favoriteEvents: user.favoriteEvents,
    });
  } catch (err) {
    console.error("❌ toggleFavoriteEvent error:", err);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại." });
  }
};

// 🔹 Lấy danh sách sự kiện yêu thích
export const getFavoriteEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate("favoriteEvents");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.favoriteEvents);
  } catch (err) {
    console.error("❌ getFavoriteEvents error:", err);
    res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại." });
  }
};

// 🧩 [ADMIN] Lấy danh sách toàn bộ người dùng
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error("❌ getAllUsers error:", err);
    res.status(500).json({ message: "Không thể lấy danh sách người dùng." });
  }
};

// 🧩 [ADMIN] Cập nhật vai trò hoặc trạng thái
export const adminUpdateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, roleId, isActive } = req.body;

    const updateFields = {};
    if (isActive !== undefined) updateFields.isActive = isActive;

    if (roleId) {
      updateFields.roleId = roleId;
    } else if (role) {
      const r = await Role.findOne({ name: role }).lean();
      if (r) updateFields.roleId = r._id;
    }
const updated = await User.findByIdAndUpdate(id, updateFields, { new: true }).select("-passwordHash");

    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json({ message: "Đã cập nhật người dùng", user: updated });
  } catch (err) {
    console.error("❌ adminUpdateUser error:", err);
    res.status(500).json({ message: "Cập nhật người dùng thất bại." });
  }
};

// 🧩 [ADMIN] Xóa người dùng
export const deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    res.json({ message: "Đã xóa người dùng thành công." });
  } catch (err) {
    console.error("❌ deleteUser error:", err);
    res.status(500).json({ message: "Xóa người dùng thất bại." });
  }
};

// 🧩 [ADMIN] Khóa / Mở khóa người dùng
export const banUser = async (req, res) => {
  try {
    const { id } = req.params;
    // ⚠️ tránh lỗi khi req.body undefined
    const reason = req.body?.reason || "";

    const user = await User.findById(id);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });

    // Nếu đang khóa → mở khóa
    if (user.isBanned) {
      user.isBanned = false;
      user.banReason = "";
      await user.save();
      return res.json({ message: `✅ Đã mở khóa tài khoản ${user.name}.` });
    }

    // Nếu chưa khóa → cần lý do
    if (!reason.trim()) {
      return res
        .status(400)
        .json({ message: "Vui lòng nhập lý do khóa tài khoản." });
    }

    user.isBanned = true;
    user.banReason = reason;
    await user.save();

    res.json({ message: `🔒 Đã khóa tài khoản ${user.name}.` });
  } catch (err) {
    console.error("❌ banUser error:", err);
    res.status(500).json({ message: "Lỗi hệ thống khi khóa/mở khóa tài khoản." });
  }
};