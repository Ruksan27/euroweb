const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Helper to hash password
UserSchema.methods.hashPassword = function(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
};

module.exports = mongoose.model('User', UserSchema);
