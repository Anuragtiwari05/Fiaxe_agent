const fs = require("fs");
const askLLM = require("../utils/askLLM");
const speechToText = require("../utils/speechToText");
const textToSpeech = require("../utils/textToSpeech");

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const reply = await askLLM(message);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "AI error",
      error: error.message,
    });
  }
};

const voiceWithAI = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Audio file is required",
      });
    }

    const transcript = await speechToText(req.file);

    if (!transcript || !transcript.trim()) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(400).json({
        success: false,
        message: "Could not understand the audio. Please speak clearly and try again.",
      });
    }

    const aiReply = await askLLM(transcript);

    let audioBase64 = null;
    let audioMimeType = null;

    try {
      const ttsResult = await textToSpeech(aiReply);
      audioBase64 = ttsResult.audioBase64;
      audioMimeType = ttsResult.audioMimeType;
    } catch (ttsError) {
      console.error("TTS failed:", ttsError.message);
    }

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(200).json({
      success: true,
      transcript,
      reply: aiReply,
      audio: audioBase64,
      audioMimeType,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("voiceWithAI error:", error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Voice processing failed",
    });
  }
};

module.exports = { voiceWithAI, chatWithAI };