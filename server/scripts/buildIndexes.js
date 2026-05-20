const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/europass';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');
  try {
    await User.init();
    console.log('Indexes built/ensured');
  } catch (err) {
    console.error('Index build error:', err);
  }
  process.exit(0);
}

run();
