const express = require('express');
const router = express.Router();
const CV = require('../models/CV');
const puppeteer = require('puppeteer');
const { generateHTML } = require('../utils/pdfTemplate');
const { uploadMemory, uploadToCloudinary } = require('../config/cloudinary');
const HTMLtoDOCX = require('html-to-docx');

// Helper: sanitize name for Cloudinary folder
const toFolderName = (name) =>
  (name || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 50);

// ─── Upload Profile Photo ───────────────────────────────────────────────────────
router.post('/upload-photo', uploadMemory.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    // Validate image type
    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMime.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only JPG, PNG, WebP images are allowed' });
    }

    const personName = (req.body.personName || 'unknown').slice(0, 60);
    const folder = `europass/${toFolderName(personName)}/photo`;
    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      resource_type: 'image',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('Photo upload error:', err.message);
    res.status(500).json({ error: 'Photo upload failed' });
  }
});

// ─── Upload Single Document ────────────────────────────────────────────────────
router.post('/upload-document', uploadMemory.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No document uploaded' });

    const allowedMime = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMime.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'Only PDF, DOC, JPG, PNG files are allowed' });
    }

    const personName = (req.body.personName || 'unknown').slice(0, 60);
    const docType = (req.body.docType || 'document').slice(0, 30);
    const folder = `europass/${toFolderName(personName)}/${docType}`;

    const result = await uploadToCloudinary(req.file.buffer, {
      folder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    });
    res.json({
      url: result.secure_url,
      publicId: result.public_id,
      name: req.file.originalname,
    });
  } catch (err) {
    console.error('Document upload error:', err.message);
    res.status(500).json({ error: 'Document upload failed' });
  }
});

// ─── Save / Update CV ──────────────────────────────────────────────────────────
router.post('/save', async (req, res) => {
  try {
    const cvData = req.body;

    // Basic validation
    if (!cvData.personalInfo?.fullName?.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    cvData.folderName = toFolderName(cvData.personalInfo.fullName);

    // Sanitize: remove __v and internal fields if sent from client
    delete cvData.__v;

    if (cvData._id) {
      const updated = await CV.findByIdAndUpdate(
        cvData._id,
        { $set: cvData },
        { new: true, runValidators: true, returnDocument: 'after' }
      );
      if (!updated) return res.status(404).json({ error: 'CV not found' });
      return res.json(updated);
    }

    const newCV = new CV(cvData);
    const savedCV = await newCV.save();
    res.status(201).json(savedCV);
  } catch (error) {
    console.error('Save error:', error.message);
    res.status(500).json({ error: 'Failed to save CV', details: error.message });
  }
});

// ─── Generate PDF ──────────────────────────────────────────────────────────────
router.get('/generate-pdf/:id', async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id).lean();
    if (!cv) return res.status(404).json({ error: 'CV not found' });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(generateHTML(cv), { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    await browser.close();

    const name = (cv.personalInfo?.fullName || 'CV').replace(/\s+/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${name}_Europass.pdf"`);
    res.contentType('application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF error:', error.message);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

// ─── Generate JPG ──────────────────────────────────────────────────────────────
router.get('/generate-jpg/:id', async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id).lean();
    if (!cv) return res.status(404).json({ error: 'CV not found' });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.setContent(generateHTML(cv), { waitUntil: 'networkidle0' });
    const imgBuffer = await page.screenshot({ type: 'jpeg', quality: 95, fullPage: true });
    await browser.close();

    const name = (cv.personalInfo?.fullName || 'CV').replace(/\s+/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${name}_Europass.jpg"`);
    res.contentType('image/jpeg');
    res.send(imgBuffer);
  } catch (error) {
    console.error('JPG error:', error.message);
    res.status(500).json({ error: 'Failed to generate JPG' });
  }
});

// ─── Generate DOCX ──────────────────────────────────────────────────────────────
router.get('/generate-docx/:id', async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id).lean();
    if (!cv) return res.status(404).json({ error: 'CV not found' });

    const htmlString = generateHTML(cv);
    const fileBuffer = await HTMLtoDOCX(htmlString, null, {
      table: { row: { cantSplit: true } },
      footer: true,
      pageNumber: true,
    });

    const name = (cv.personalInfo?.fullName || 'CV').replace(/\s+/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${name}_Europass.docx"`);
    res.contentType('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(fileBuffer);
  } catch (error) {
    console.error('DOCX error:', error.message);
    res.status(500).json({ error: 'Failed to generate DOCX' });
  }
});

// ─── List All CVs ──────────────────────────────────────────────────────────────
router.get('/list', async (req, res) => {
  try {
    const cvs = await CV.find().sort({ createdAt: -1 }).lean();
    res.json(cvs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CVs' });
  }
});

// ─── Delete CV ─────────────────────────────────────────────────────────────────
router.delete('/delete/:id', async (req, res) => {
  try {
    const deleted = await CV.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'CV not found' });
    res.json({ message: 'CV deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete CV' });
  }
});

module.exports = router;
