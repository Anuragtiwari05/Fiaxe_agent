const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

dotenv.config();

console.log("🚀 Starting server...");
console.log("ENV CHECK:");
console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Present" : "❌ Missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ Present" : "❌ Missing");

const app = express();

/* ================= CORS ================= */
console.log("⚙️ Setting up CORS...");
app.use(cors());

app.use((req, res, next) => {
  console.log("🌐 CORS Middleware hit");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    console.log("⚡ Preflight request handled");
    return res.sendStatus(200);
  }

  next();
});

/* ================= MIDDLEWARE ================= */
console.log("⚙️ Applying JSON middleware...");
app.use(express.json());

/* ================= DEBUG LOGGER ================= */
app.use((req, res, next) => {
  console.log("=================================");
  console.log("📥 Incoming Request");
  console.log("METHOD:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("HEADERS:", req.headers);
  console.log("BODY:", req.body);
  console.log("=================================");
  next();
});

/* ================= ROUTES ================= */
console.log("⚙️ Loading routes...");

const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

console.log("✅ Routes loaded");

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  console.log("🏠 Root route hit");
  res.json({
    success: true,
    message: "API is running...",
  });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL ERROR HANDLER:");
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log("🔌 Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
    });

    console.log("✅ MongoDB Connected");

    mongoose.connection.on("connected", () => {
      console.log("🟢 Mongoose event: connected");
    });

    mongoose.connection.on("error", (err) => {
      console.error("🔴 Mongoose event: error", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🟡 Mongoose event: disconnected");
    });

    console.log("🚀 Starting Express server...");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ MongoDB Connection Error:");
    console.error(error);
  }
}

startServer();