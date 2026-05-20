const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/europass';
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');

  const adminEmail = 'rukshankarki80@gmail.com';
  const adminNorm = adminEmail;

  // Drop old index on `email` if it exists
  try {
    const collection = mongoose.connection.db.collection('users');
    const indexes = await collection.indexes();
    console.log('Existing indexes:', indexes.map(i=>i.name));
    const emailIndex = indexes.find(i => i.key && i.key.email === 1);
    if (emailIndex) {
      console.log('Dropping old email index:', emailIndex.name);
      await collection.dropIndex(emailIndex.name);
    }
  } catch (err) {
    console.warn('Index cleanup warning:', err.message);
  }

  // Ensure normalizedEmail index exists (mongoose index declaration should create it on model init, but create here defensively)
  try {
    await User.init();
    console.log('Ensured mongoose indexes');
  } catch (err) {
    console.error('Error ensuring indexes:', err.message);
  }

  // Ensure admin exists and has normalizedEmail/admin role
  let admin = await User.findOne({ normalizedEmail: adminNorm });
  if (!admin) {
    admin = await User.findOne({ email: adminEmail });
  }
  if (!admin) {
    const hashed = User.hashPassword('Ruksan@#12');
    admin = new User({
      email: adminEmail,
      normalizedEmail: adminNorm,
      password: hashed,
      fullName: 'System Administrator',
      role: 'admin'
    });
    await admin.save();
    console.log('Admin created');
  } else {
    admin.normalizedEmail = adminNorm;
    admin.role = 'admin';
    admin.password = User.hashPassword('Ruksan@#12');
    await admin.save();
    console.log('Admin updated');
  }

  // Delete all other users
  const res = await User.deleteMany({ normalizedEmail: { $ne: adminNorm } });
  console.log('Deleted users count:', res.deletedCount);

  // Final check
  const remaining = await User.find();
  console.log('Remaining users in collection:', remaining.map(u=>({email:u.email, normalizedEmail:u.normalizedEmail, role:u.role})));

  process.exit(0);
}

run().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
