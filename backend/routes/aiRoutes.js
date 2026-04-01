const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || ".webm";
    cb(null, `audio-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

router.post("/chat", authMiddleware, aiController.chatWithAI);
router.post("/voice", authMiddleware, upload.single("audio"), aiController.voiceWithAI);

module.exports = router;