const axios = require("axios");

const textToSpeech = async (text) => {
  try {
    const response = await axios.post(
      "https://api.sarvam.ai/text-to-speech",
      {
        text,
        model: "bulbul:v3",
        target_language_code: "en-IN",
        speaker: "simran", // ✅ your voice
      },
      {
        headers: {
          "api-subscription-key": process.env.SARVAM_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Sarvam returns base64 audio inside "audios"
    const audioBase64 = response?.data?.audios?.[0];

    if (!audioBase64) {
      console.error("Sarvam bad response:", response.data);
      throw new Error("No audio returned from Sarvam");
    }

    return {
      audioBase64,
      audioMimeType: "audio/wav", // usually wav
    };
  } catch (error) {
    console.error("Sarvam status:", error?.response?.status);
    console.error("Sarvam error:", error?.response?.data || error.message);

    throw new Error("Text-to-speech failed");
  }
};

module.exports = textToSpeech;