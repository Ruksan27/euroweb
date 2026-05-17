const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const CV = require('../models/CV');

// ─── Admin Login ───────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  const isValid =
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD;

  if (!isValid) {
    // Small delay to slow brute force
    setTimeout(() => {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }, 500);
    return;
  }

  const token = jwt.sign(
    { role: 'admin', iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ success: true, token });
});

// ─── Middleware: Verify Admin Token ────────────────────────────────────────────
const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error('Not admin');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ─── Get All CVs ───────────────────────────────────────────────────────────────
router.get('/cvs', verifyAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const [cvs, total] = await Promise.all([
      CV.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CV.countDocuments()
    ]);
    res.json({ cvs, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CVs' });
  }
});

// ─── Get Single CV ─────────────────────────────────────────────────────────────
router.get('/cvs/:id', verifyAdmin, async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id).lean();
    if (!cv) return res.status(404).json({ error: 'CV not found' });
    res.json(cv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CV' });
  }
});

// ─── Update CV (Admin Edit) ────────────────────────────────────────────────────
router.put('/cvs/:id', verifyAdmin, async (req, res) => {
  try {
    const cvData = req.body;
    delete cvData.__v;
    const updated = await CV.findByIdAndUpdate(
      req.params.id,
      { $set: cvData },
      { new: true, runValidators: true, returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ error: 'CV not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update CV' });
  }
});

// ─── Delete CV ─────────────────────────────────────────────────────────────────
router.delete('/cvs/:id', verifyAdmin, async (req, res) => {
  try {
    const deleted = await CV.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'CV not found' });
    res.json({ success: true, message: 'CV deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete CV' });
  }
});

module.exports = router;
