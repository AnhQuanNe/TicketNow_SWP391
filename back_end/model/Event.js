// models/Event.js
const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  type: { type: String, required: true },   // Standard, VIP, VVIP
  price: { type: Number, required: true },  // giá vé
  quantity: { type: Number, required: true } // số lượng vé
});

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    // Liên kết
    locationId: { type: String, required: true },   // sau này có thể tham chiếu Location collection
    categoryId: { type: String, required: true },   // tham chiếu Category collection
    organizerId: { type: String, required: true },  // organizer (user role = organizer)

    // Vé
    tickets: [ticketSchema], // danh sách loại vé

    status: { 
      type: String, 
      enum: ["upcoming", "ongoing", "completed", "cancelled"], 
      default: "upcoming" 
    },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: null }
  },
  { versionKey: false }
);

module.exports = mongoose.model("Event", eventSchema);
