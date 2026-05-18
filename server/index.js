const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load env first
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5005;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// ─── Security Headers ───────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ─── CORS (lock to frontend origin) ────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin === CLIENT_ORIGIN || /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
  credentials: true
}));

// ─── Rate Limiting ──────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later.' }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { error: 'AI extraction rate limit reached, wait a minute.' }
});

const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts, please try again later.' }
});

app.use(generalLimiter);

// ─── Body Parsers ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Request Logger (dev only) ─────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.originalUrl}`);
    next();
  });
}

// ─── MongoDB ────────────────────────────────────────────────────────────────────
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/europass', {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// ─── Health Check ───────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/ai', aiLimiter, require('./routes/aiRoutes'));
app.use('/api/cv', require('./routes/cvRoutes'));
app.use('/api/admin', adminLoginLimiter, require('./routes/adminRoutes'));

// ─── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ───────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
