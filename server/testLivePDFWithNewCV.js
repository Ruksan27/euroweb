const mongoose = require('mongoose');
const axios = require('axios');

async function testLivePDFWithNewCV() {
  const uri = "mongodb+srv://ruksankarki80:m2h1GmU1uuxwSLyc@cluster0.o903jsg.mongodb.net/europass";
  console.log("Connecting to online MongoDB Atlas to insert a CV...");
  try {
    await mongoose.connect(uri);
    const CV = require('./models/CV');
    
    // Insert a test CV
    const testCV = new CV({
      personalInfo: {
        fullName: "Test Puppeteer",
        email: "test@puppeteer.com"
      },
      photoShape: "rounded",
      cvFormat: "europass",
      themeColor: "#0e4a8e",
      digitalSkills: ["Computer"],
      otherSkills: ["Canva"]
    });
    
    const saved = await testCV.save();
    const id = saved._id.toString();
    console.log(`✅ Saved test CV in online DB with ID: ${id}`);
    
    const url = `https://euroweb-backend.onrender.com/api/cv/generate-pdf/${id}`;
    console.log(`Sending GET request to live PDF generator: ${url}`);
    
    // Clean up connections so they don't block
    await mongoose.disconnect();
    
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    console.log(`🎉 Success! Live PDF generated! Buffer length: ${res.data.length} bytes`);
    
    // Delete the test CV afterwards
    await mongoose.connect(uri);
    await CV.findByIdAndDelete(id);
    console.log("🧹 Cleaned up test CV from database.");
  } catch (error) {
    if (error.response) {
      console.log("❌ Error Status:", error.response.status);
      const dataStr = Buffer.from(error.response.data).toString('utf8');
      console.log("❌ Error Data:", dataStr);
    } else {
      console.error("❌ Error:", error.message);
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

testLivePDFWithNewCV();
