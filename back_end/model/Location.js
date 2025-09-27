// back_end/model/Location.js
import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    _id: {
      type: String, // ví dụ: "loc_1"
      required: true,
    },
    venueName: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 0,
    },
    city: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
  },
  { timestamps: true } // thêm createdAt, updatedAt tự động
);

export default mongoose.model("Location", locationSchema);
