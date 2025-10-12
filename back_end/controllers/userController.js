import User from "../model/User.js";

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

// 🔹 Cập nhật thông tin người dùng
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Không cho sửa email & phone
    if (req.body.email) delete req.body.email;
    if (req.body.phone) delete req.body.phone;

    // Nếu đã có studentId thì không cho đổi
    if (user.studentId && req.body.studentId && req.body.studentId !== user.studentId) {
      delete req.body.studentId;
    }

    // Cho phép đổi name & avatar vô hạn lần
    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar || user.avatar;

    // Nếu chưa có studentId thì cho nhập 1 lần
    if (!user.studentId && req.body.studentId) {
      user.studentId = req.body.studentId;
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
