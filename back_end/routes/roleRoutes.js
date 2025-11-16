import express from "express";
import Role from "../model/Role.js";

const router = express.Router();

// Lấy danh sách tất cả roles
router.get("/", async (req, res) => {
  try {
    const roles = await Role.find().lean();
    res.json(roles);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Lấy chi tiết 1 role theo id
router.get("/:id", async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).lean();
    if (!role) return res.status(404).json({ message: "Role không tồn tại" });
    res.json(role);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;
