const axios = require("axios");

const askLLM = async (prompt) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `
You are Simran, a friendly AI voice assistant.

Rules:
- Your name is Simran.
- Do not introduce yourself in every answer.
- Only answer the user's question naturally and conversationally.
- Keep answers short, clear, and voice-friendly unless the user asks for detail.
- Do not sound robotic.
- Be warm, polite, and confident.
- Since this is a voice conversation, avoid overly long paragraphs.
            `.trim(),
          },
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

    return (
      response.data?.choices?.[0]?.message?.content || "No response generated."
    );
  } catch (error) {
    console.error("Groq error status:", error?.response?.status);
    console.error(
      "Groq error data:",
      JSON.stringify(error?.response?.data, null, 2)
    );
    throw new Error(
      error?.response?.data?.error?.message || "Groq request failed"
    );
  }
};

module.exports = askLLM;