const axios = require('axios');
require('dotenv').config();

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  try {
    const response = await axios.post(url, {
      contents: [{ parts: [{ text: "Say hello!" }] }]
    });
    console.log("Direct Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("Direct Error Status:", error.response.status);
      console.log("Direct Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Direct Error Message:", error.message);
    }
  }
}

test();
