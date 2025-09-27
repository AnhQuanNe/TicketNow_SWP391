const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    roleId: { type: String, required: true },

    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null }
});

module.exports = mongoose.model("User", userSchema);
