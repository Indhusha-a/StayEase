const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');
const {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getAssignedComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  uploadComplaintImage,
} = require('./complaintController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join('uploads', 'complaints');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }

  return cb(new Error('Only JPG and PNG images are allowed'));
};

const uploadComplaintEvidence = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const handleImageUpload = (req, res, next) => {
  uploadComplaintEvidence.single('image')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ message: error.message });
    }
    return next();
  });
};

router.post('/', protect, authorizeRoles('guest', 'staff'), createComplaint);
router.get('/', protect, authorizeRoles('admin'), getAllComplaints);
router.get('/my', protect, authorizeRoles('guest', 'staff'), getMyComplaints);
router.get('/assigned/my', protect, authorizeRoles('staff'), getAssignedComplaints);
router.get('/:id', protect, getComplaintById);
router.put('/:id/status', protect, authorizeRoles('admin'), updateComplaintStatus);
router.delete('/:id', protect, authorizeRoles('admin'), deleteComplaint);
router.post(
  '/:id/image',
  protect,
  authorizeRoles('guest', 'staff'),
  handleImageUpload,
  uploadComplaintImage
);

module.exports = router;
