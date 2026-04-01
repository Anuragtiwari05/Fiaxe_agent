const axios = require("axios");

const askLLM = async (prompt) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt,
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

    return response.data?.choices?.[0]?.message?.content || "No response generated.";
  } catch (error) {
    console.error("Groq error status:", error?.response?.status);
    console.error("Groq error data:", JSON.stringify(error?.response?.data, null, 2));
    throw new Error(
      error?.response?.data?.error?.message || "Groq request failed"
    );
  }
};

module.exports = askLLM;