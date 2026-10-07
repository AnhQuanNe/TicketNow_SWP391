import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import User from "../model/User.js";
import Role from "../model/Role.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/TicketNow";

async function createAdmin() {
  try {
    console.log("Connecting to MongoDB:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // 1. Ensure admin role exists
    let adminRole = await Role.findOne({ name: "admin" });
    if (!adminRole) {
      adminRole = await Role.create({ name: "admin" });
      console.log("Created admin role with ID:", adminRole._id);
    } else {
      console.log("Admin role already exists with ID:", adminRole._id);
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";
    const adminPhone = "0900000001";
    const adminName = "System Admin";

    // 2. Check if user with adminEmail exists
    let user = await User.findOne({ email: adminEmail });

    if (user) {
      console.log(`User ${adminEmail} already exists. Updating to admin role and verified status...`);
      user.name = adminName;
      user.roleId = adminRole._id;
      user.emailVerified = true;
      user.isBanned = false;
      user.authProvider = "local";
      // Setting passwordHash to plaintext triggers pre('save') bcrypt hashing
      user.passwordHash = adminPassword;
      await user.save();
      console.log(`Successfully updated admin user: ${adminEmail}`);
    } else {
      // Check if phone is already taken
      const phoneUser = await User.findOne({ phone: adminPhone });
      if (phoneUser) {
        phoneUser.phone = undefined;
        await phoneUser.save();
      }

      user = new User({
        name: adminName,
        email: adminEmail,
        passwordHash: adminPassword,
        phone: adminPhone,
        roleId: adminRole._id,
        authProvider: "local",
        emailVerified: true,
        isBanned: false,
      });

      await user.save();
      console.log(`Successfully created new admin user: ${adminEmail}`);
    }

    console.log("-----------------------------------------");
    console.log("THÔNG TIN TÀI KHOẢN ADMIN:");
    console.log(`- Email: ${adminEmail}`);
    console.log(`- Mật khẩu: ${adminPassword}`);
    console.log(`- Role: admin`);
    console.log(`- Email Verified: true`);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Error creating admin account:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

createAdmin();
