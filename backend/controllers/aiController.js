const fs = require("fs");
const askLLM = require("../utils/askLLM");
const speechToText = require("../utils/speechToText");
const textToSpeech = require("../utils/textToSpeech");

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const reply = await askLLM(message);
    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      message: "AI error",
      error: error.message,
    });
  }
};

const voiceWithAI = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Audio file is required" });
    }

    const userText = await speechToText(req.file);

    if (!userText || !userText.trim()) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({
        message: "Could not detect speech from audio",
      });
    }

    const aiReply = await askLLM(userText);
    const audioBuffer = await textToSpeech(aiReply);

    if (req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Disposition": "inline; filename=reply.mp3",
      "X-User-Text": encodeURIComponent(userText),
      "X-AI-Reply": encodeURIComponent(aiReply),
    });

    return res.send(audioBuffer);
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      message: "Voice AI error",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithAI,
  voiceWithAI,
};