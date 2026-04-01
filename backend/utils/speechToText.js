const axios = require("axios");
const fs = require("fs");

const speechToText = async (file) => {
  try {
    const audioStream = fs.createReadStream(file.path);

    const response = await axios.post(
      "https://api.deepgram.com/v1/listen",
      audioStream,
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/webm",
        },
      }
    );

    const text =
      response.data.results.channels[0].alternatives[0].transcript;

    return text;
  } catch (error) {
    console.log(error);
    throw new Error("Speech to text failed");
  }
};

module.exports = speechToText;