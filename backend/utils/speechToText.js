const axios = require("axios");
const fs = require("fs");

const speechToText = async (file) => {
  try {
    console.log("File received:", file?.originalname);
    console.log("File path:", file?.path);
    console.log("File mimetype:", file?.mimetype);
    console.log("File size:", file?.size);

    const audioBuffer = fs.readFileSync(file.path);

    const response = await axios.post(
      "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true",
      audioBuffer,
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": file.mimetype || "audio/webm",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }
    );

    const text =
      response?.data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    return text.trim();
  } catch (error) {
    console.log("Speech-to-text status:", error?.response?.status);
    console.log(
      "Speech-to-text error:",
      error?.response?.data || error.message
    );
    throw new Error("Speech to text failed");
  }
};

module.exports = speechToText;