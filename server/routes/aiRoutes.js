const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractDataFromDocument } = require('../controllers/aiController');

// Using Local Storage for Testing
const upload = multer({ dest: 'uploads/' });

// Allow uploading multiple documents (up to 5 files at once)
router.post('/extract', (req, res, next) => {
  upload.array('documents', 5)(req, res, function (err) {
    if (err) {
      console.error("MULTER UPLOAD ERROR:", err);
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: "File upload failed", details: "You can upload a maximum of 5 documents at a time." });
      }
      return res.status(400).json({ error: "File upload failed", details: err.message });
    }
    next();
  });
}, extractDataFromDocument);

module.exports = router;
