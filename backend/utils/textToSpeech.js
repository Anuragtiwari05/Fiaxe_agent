const axios = require("axios");

const textToSpeech = async (text) => {
  try {
    const response = await axios.post(
      "https://api.sarvam.ai/text-to-speech",
      {
        text: text,
        voice: "anushka",
      },
      {
        headers: {
          "api-key": process.env.SARVAM_API_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    return response.data; // audio buffer
  } catch (error) {
    console.log(error);
    throw new Error("TTS failed");
  }
};

module.exports = textToSpeech;