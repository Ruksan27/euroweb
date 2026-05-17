const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

async function testLivePDF() {
  // Connect to DB to get a valid CV ID
  await mongoose.connect(process.env.MONGODB_URI);
  const CV = require('./models/CV');
  const firstCV = await CV.findOne().lean();
  await mongoose.disconnect();

  if (!firstCV) {
    console.log("No CVs found in database. Please save a CV first!");
    return;
  }

  const id = firstCV._id.toString();
  console.log(`Found CV ID in DB: ${id}`);
  
  const url = `https://euroweb-backend.onrender.com/api/cv/generate-pdf/${id}`;
  console.log(`Sending GET request to: ${url}`);

  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    console.log("Success! PDF received, buffer length:", res.data.length);
  } catch (error) {
    if (error.response) {
      console.log("Error Status:", error.response.status);
      const dataStr = Buffer.from(error.response.data).toString('utf8');
      console.log("Error Data:", dataStr);
    } else {
      console.error("Error Message:", error.message);
    }
  }
}

testLivePDF();
