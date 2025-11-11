import mongoose from "mongoose";

const roleSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // 🟢 thêm dòng này
  name: {
    type: String,
    enum: ["admin", "user", "organizer"],
    required: true,
    unique: true,
  },
});

const Role = mongoose.model("Role", roleSchema, "Roles");
export default Role;
