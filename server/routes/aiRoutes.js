const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractDataFromDocument } = require('../controllers/aiController');

// Using Local Storage for Testing
const upload = multer({ dest: 'uploads/' });

// Allow uploading multiple documents (up to 10 files at once)
router.post('/extract', (req, res, next) => {
  upload.array('documents', 10)(req, res, function (err) {
    if (err) {
      console.error("MULTER UPLOAD ERROR:", err);
      return res.status(400).json({ error: "File upload failed", details: err.message });
    }
    next();
  });
}, extractDataFromDocument);

module.exports = router;
