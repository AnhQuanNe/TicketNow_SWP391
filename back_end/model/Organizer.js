// back_end/model/Organizer.js
import mongoose from "mongoose";

const organizerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    organizationName: { type: String, required: true },
    description: { type: String },
    contactPhone: { type: String },
    address: { type: String },
    socialLinks: {
      facebook: String,
      website: String,
    },
    events: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Organizer", organizerSchema, "Organizers");
