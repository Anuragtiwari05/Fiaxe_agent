const express = require("express");
const router = express.Router();

const { chatWithAI } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

// protected route
router.post("/chat", authMiddleware, chatWithAI);

module.exports = router;
