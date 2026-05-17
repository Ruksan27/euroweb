const mongoose = require('mongoose');

async function testOnlineDB() {
  const uri = "mongodb+srv://ruksankarki80:m2h1GmU1uuxwSLyc@cluster0.o903jsg.mongodb.net/europass";
  console.log("Connecting to online MongoDB Atlas...");
  try {
    await mongoose.connect(uri);
    console.log("✅ Successfully connected to online MongoDB Atlas!");
    const CV = require('./models/CV');
    const count = await CV.countDocuments();
    console.log(`Total CVs in online DB: ${count}`);
    if (count > 0) {
      const first = await CV.findOne().lean();
      console.log(`First CV ID: ${first._id}`);
    }
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testOnlineDB();
