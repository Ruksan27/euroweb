require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
  try {
    console.log("Testing Gemini API Key:", process.env.GEMINI_API_KEY);
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const response = await model.generateContent("Say hello!");
    console.log("Response:", response.response.text());
    console.log("✅ Gemini API Key is working perfectly!");
  } catch (error) {
    console.error("❌ Gemini API Key test failed:", error);
  }
}

test();
