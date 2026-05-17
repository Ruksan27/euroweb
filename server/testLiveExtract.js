const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testLiveExtract() {
  const url = 'https://euroweb-backend.onrender.com/api/ai/extract';
  
  // Create a dummy text file
  const dummyPath = path.join(__dirname, 'dummy_cv.txt');
  fs.writeFileSync(dummyPath, 'Name: John Doe\nEmail: john@example.com\nExperience: 5 years at Google');

  const form = new FormData();
  form.append('documents', fs.createReadStream(dummyPath));

  console.log("Sending POST request to live backend...");
  try {
    const response = await axios.post(url, form, {
      headers: form.getHeaders()
    });
    console.log("Success Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("Error Status:", error.response.status);
      console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error Message:", error.message);
    }
  } finally {
    // Clean up dummy file
    if (fs.existsSync(dummyPath)) {
      fs.unlinkSync(dummyPath);
    }
  }
}

testLiveExtract();
