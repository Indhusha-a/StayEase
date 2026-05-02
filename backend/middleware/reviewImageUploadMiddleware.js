const fs = require('fs');
const multer = require('multer');
const path = require('path');

const REVIEW_UPLOAD_DIR = path.join('uploads', 'reviews');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(REVIEW_UPLOAD_DIR, { recursive: true });
    cb(null, REVIEW_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const basename = path
      .basename(file.originalname || 'review-image', extension)
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    const uniqueName = `${basename || 'review-image'}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, uniqueName);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedExt = /\.(jpe?g|png)$/i;
  const allowedMime = /^(image\/jpeg|image\/jpg|image\/png)$/i;
  const extOk = allowedExt.test(path.extname(file.originalname || ''));
  const mimeOk = allowedMime.test(file.mimetype || '');

  // Some mobile pickers provide generic MIME types. Accept a valid extension to avoid false rejects.
  if (extOk || mimeOk) {
    cb(null, true);
    return;
  }

  cb(new Error('Only JPG and PNG review images are allowed'));
};

const reviewImageUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = reviewImageUpload;
