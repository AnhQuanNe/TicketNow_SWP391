// back_end/model/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    _id: {
      type: String, // ví dụ: "cat_1"
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true } // tự động thêm createdAt, updatedAt
);

export default mongoose.model("Category", categorySchema);
