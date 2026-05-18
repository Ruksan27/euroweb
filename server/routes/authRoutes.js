const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const auth = require('../middleware/auth');

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// ─── Register ──────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = hashPassword(password);
    const newUser = new User({
      fullName,
      email: normalizedEmail,
      password: hashedPassword
    });

    const savedUser = await newUser.save();
    
    // Create JWT Token
    const token = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ─── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Create JWT Token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ─── Get Current User ──────────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
