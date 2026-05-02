const express = require('express');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');
const {
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  uploadStaffPhoto,
} = require('./staffController');

const router = express.Router();

router.post('/', protect, authorizeRoles('admin'), addStaff);
router.get('/', protect, authorizeRoles('admin'), getAllStaff);
router.get('/:id', protect, authorizeRoles('admin', 'staff'), getStaffById);
router.put('/:id', protect, authorizeRoles('admin'), updateStaff);
router.delete('/:id', protect, authorizeRoles('admin'), deleteStaff);
router.post('/:id/photo', protect, authorizeRoles('admin'), upload.single('photo'), uploadStaffPhoto);

module.exports = router;
