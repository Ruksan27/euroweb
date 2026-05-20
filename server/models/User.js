const mongoose = require('mongoose');
const crypto = require('crypto');

function normalizeGmailAddress(email) {
  if (!email || typeof email !== 'string') return email;
  const parts = email.split('@');
  if (parts.length !== 2) return email.toLowerCase().trim();
  let [local, domain] = parts;
  domain = domain.toLowerCase().trim();
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    // remove dot separators and strip +aliases
    local = local.split('+')[0].replace(/\./g, '');
  }
  return `${local.toLowerCase()}@${domain}`.trim();
}

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  normalizedEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, trim: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Ensure normalizedEmail is present before validation/save
UserSchema.pre('validate', function() {
  if (!this.normalizedEmail && this.email) {
    this.normalizedEmail = normalizeGmailAddress(this.email.toLowerCase().trim());
  }
});

// Static helper to hash a password
UserSchema.statics.hashPassword = function(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

// Instance method to verify a password
UserSchema.methods.verifyPassword = function(password) {
  const parts = this.password.split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === originalHash;
};

module.exports = mongoose.model('User', UserSchema);

// Export helper for other modules if needed
module.exports.normalizeGmailAddress = normalizeGmailAddress;
