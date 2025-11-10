// back_end/controllers/organizerController.js
import mongoose from "mongoose";
import Organizer from "../model/Organizer.js";

// 🟢 Lấy thông tin profile của organizer
export const getOrganizerProfile = async (req, res) => {
  try {
    console.log("🧠 Organizer profile request for userId:", req.user._id);

    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    const organizer = await Organizer.findOne({ userId: userObjectId })
      .populate("userId", "name email");

    if (!organizer) {
      console.log("⚠️ Không tìm thấy organizer cho userId:", req.user._id);
      return res.status(200).json({ message: "not_found" });
    }

    res.status(200).json(organizer);
  } catch (err) {
    console.error("❌ Lỗi getOrganizerProfile:", err);
    res.status(500).json({ error: err.message });
  }
};

// 🟠 Cập nhật profile
export const updateOrganizerProfile = async (req, res) => {
  try {
    const userObjectId = new mongoose.Types.ObjectId(req.user._id);

    const organizer = await Organizer.findOneAndUpdate(
      { userId: userObjectId },
      req.body,
      { new: true }
    );

    if (!organizer)
      return res.status(404).json({ message: "Organizer not found to update" });

    res.status(200).json(organizer);
  } catch (err) {
    console.error("❌ Lỗi updateOrganizerProfile:", err);
    res.status(500).json({ error: err.message });
  }
};
