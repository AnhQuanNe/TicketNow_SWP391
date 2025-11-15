import mongoose from "mongoose";

const registerLogSchema = new mongoose.Schema({
  email: String,
  ip: String,
  device: String,
  time: Date,
  success: Boolean,
});

export default mongoose.model("RegisterLog", registerLogSchema);
 