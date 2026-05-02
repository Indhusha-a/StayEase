const fs = require('fs');
const multer = require('multer');
const path = require('path');

const SLIP_UPLOAD_DIR = path.join('uploads', 'slips');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(SLIP_UPLOAD_DIR, { recursive: true });
    cb(null, SLIP_UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const basename = path
      .basename(file.originalname || 'slip', extension)
      .replace(/[^a-zA-Z0-9_-]/g, '_');

    const uniqueName = `${basename || 'slip'}-${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${extension}`;

    cb(null, uniqueName);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedExt = /\.(jpe?g|png|pdf)$/i;
  const allowedMime = /^(image\/jpeg|image\/jpg|image\/png|application\/pdf|application\/x-pdf)$/i;
  const extOk = allowedExt.test(path.extname(file.originalname || ''));
  const mimeOk = allowedMime.test(file.mimetype || '');

  // Some mobile pickers provide generic MIME types (for example application/octet-stream).
  // Accept the file when either extension or MIME is valid to avoid false rejections.
  if (extOk || mimeOk) {
    cb(null, true);
    return;
  }

  cb(new Error('Only JPG, PNG, or PDF slips are allowed'));
};

const paymentSlipUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE }
});

module.exports = paymentSlipUpload;
