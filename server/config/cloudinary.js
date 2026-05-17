const cloudinary = require('cloudinary').v2;
const multer = require('multer');

cloudinary.config({
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
  api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
  api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim()
});

// Use memory storage - we handle upload manually for folder support
const memStorage = multer.memoryStorage();
const uploadMemory = multer({
  storage: memStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload to Cloudinary with custom folder per person
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
    stream.end(buffer);
  });
};

module.exports = { cloudinary, uploadMemory, uploadToCloudinary };
