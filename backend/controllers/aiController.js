const axios = require("axios");

// Chat with AI (Groq)
exports.chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const reply = response.data.choices[0].message.content;

    res.status(200).json({
      reply,
    });
  } catch (error) {
    res.status(500).json({
      message: "AI error",
      error: error.message,
    });
  }
};
