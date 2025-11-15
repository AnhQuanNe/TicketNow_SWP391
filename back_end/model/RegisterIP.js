import mongoose from "mongoose";

const registerIPSchema = new mongoose.Schema({
  ip: String,
  count: Number,
  lastRegister: Date,
});

export default mongoose.model("RegisterIP", registerIPSchema);
