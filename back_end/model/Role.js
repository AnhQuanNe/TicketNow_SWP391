import mongoose from "mongoose";

// Sử dụng ObjectId mặc định làm _id
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: ["admin", "user", "organizer"],
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    collection: "Roles",
    versionKey: false,
    timestamps: false,
  }
);

export default mongoose.model("Role", roleSchema);