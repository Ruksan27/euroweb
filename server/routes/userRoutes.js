const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { normalizeGmailAddress } = require('../models/User');
const { verifyUser } = require('../middleware/auth');

// ─── Register ─────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const normalizedEmail = normalizeGmailAddress(cleanEmail);

    // Enforce admin constraints on registration
    if (normalizedEmail === 'rukshankarki80@gmail.com' && password !== 'Ruksan@#12') {
      return res.status(400).json({ error: 'Invalid password for this administrator email' });
    }

    const existingUser = await User.findOne({ normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const role = normalizedEmail === 'rukshankarki80@gmail.com' ? 'admin' : 'user';
    const hashedPassword = User.hashPassword(password);
    const user = new User({
      email: cleanEmail,
      normalizedEmail,
      password: hashedPassword,
      fullName: typeof fullName === 'string' ? fullName.trim() : fullName,
      role
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Handle duplicate key error from MongoDB
    if (error && error.code === 11000) {
      return res.status(400).json({ error: 'Email is already registered' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Invalid input format' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const normalizedEmail = normalizeGmailAddress(cleanEmail);

    let user;
    if (normalizedEmail === 'rukshankarki80@gmail.com') {
      // Direct Admin validation
      if (password !== 'Ruksan@#12') {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      user = await User.findOne({ normalizedEmail });
      if (!user) {
        // Automatically seed admin user if not exists
        const hashedPassword = User.hashPassword('Ruksan@#12');
        user = new User({
          email: 'rukshankarki80@gmail.com',
          normalizedEmail: 'rukshankarki80@gmail.com',
          password: hashedPassword,
          fullName: 'System Administrator',
          role: 'admin'
        });
        await user.save();
      } else {
        // Ensure role is admin and password matches
        let isModified = false;
        if (user.role !== 'admin') {
          user.role = 'admin';
          isModified = true;
        }
        if (!user.verifyPassword('Ruksan@#12')) {
          user.password = User.hashPassword('Ruksan@#12');
          isModified = true;
        }
        if (isModified) {
          await user.save();
        }
      }
    } else {
      user = await User.findOne({ normalizedEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const isMatch = user.verifyPassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Hard safety guard: verify non-admin email doesn't possess admin role
      if (user.role === 'admin') {
        user.role = 'user';
        await user.save();
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── Profile ──────────────────────────────────────────────────────────────────
router.get('/profile', verifyUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
