const Groq = require("groq-sdk");
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testGroq() {
  try {
    console.log("Testing Groq API...");
    console.log("API Key starts with:", process.env.GROQ_API_KEY?.substring(0, 10) + "...");
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: "Return this JSON: {\"test\": true}" }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    });

    console.log("SUCCESS! Groq response:", chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error("GROQ FAILED:", error.message);
  }
}

testGroq();
