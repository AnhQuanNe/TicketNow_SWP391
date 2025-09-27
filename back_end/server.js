const express = require("express");
const connectDB = require("./utils/db");

const app = express();

// Kết nối MongoDB
connectDB();

// Middleware
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("🚀 TicketNow Backend is running!");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running at http://localhost:${PORT}`));

const Role = require("./model/Role"); // import model Role

async function testRoles() {
  const roles = [
    { _id: "role_admin", name: "admin" },
    { _id: "role_user", name: "user" },
    { _id: "role_organizer", name: "organizer" },
  ];

  for (const r of roles) {
    await Role.updateOne({ _id: r._id }, r, { upsert: true });
  }

  console.log(await Role.find());
}

// Gọi hàm test khi server chạy
testRoles();

