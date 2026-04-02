const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");

dotenv.config();

const app = express();

/* ================= CORS (ALLOW ALL) ================= */
app.use(cors()); // allow all origins

/* ================= PRE-FLIGHT HANDLER ================= */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    console.log("🔥 Preflight request received");
    return res.sendStatus(200);
  }

  next();
});

/* ================= DEBUG LOGGER ================= */
app.use((req, res, next) => {
  console.log("=================================");
  console.log("METHOD:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("ORIGIN:", req.headers.origin);
  console.log("HEADERS:", req.headers);
  console.log("BODY:", req.body);
  console.log("=================================");
  next();
});

/* ================= MIDDLEWARE ================= */
app.use(express.json());

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

/* ================= ROUTES ================= */
const authRoutes = require("./routes/authRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiRoutes);

/* ================= TEST ROUTE ================= */
app.get("/test", (req, res) => {
  console.log("✅ TEST ROUTE HIT");
  res.json({ message: "Backend working fine 🚀" });
});

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running...",
  });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error("❌ ERROR OCCURRED:");
  console.error(err);

  res.status(500).json({
    success: false,
    message: err.message || "Server Error",
  });
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  console.log("❌ ROUTE NOT FOUND:", req.originalUrl);
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});