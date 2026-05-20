const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/europass';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');

  const adminEmail = 'rukshankarki80@gmail.com';
  let existing = await User.findOne({ normalizedEmail: adminEmail });
  if (!existing) {
    existing = await User.findOne({ email: adminEmail });
  }

  const hashed = User.hashPassword('Ruksan@#12');
  if (existing) {
    existing.normalizedEmail = adminEmail;
    existing.password = hashed;
    existing.fullName = 'System Administrator';
    existing.role = 'admin';
    await existing.save();
    console.log('Admin user updated:', adminEmail);
    process.exit(0);
  }

  const user = new User({
    email: adminEmail,
    normalizedEmail: adminEmail,
    password: hashed,
    fullName: 'System Administrator',
    role: 'admin'
  });

  await user.save();
  console.log('Admin user created:', adminEmail);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
