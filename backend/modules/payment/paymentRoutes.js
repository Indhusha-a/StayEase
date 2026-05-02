const express = require('express');
const router = express.Router();

const {
  createPayment,
  uploadSlip,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats
} = require('./paymentController');

const { protect, authorizeRoles } = require('../../middleware/authMiddleware');
const paymentSlipUpload = require('../../middleware/paymentSlipUploadMiddleware');

const handleSlipUpload = (req, res, next) => {
  paymentSlipUpload.single('slip')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Slip must be 5MB or smaller' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Keep static routes above '/:id' to avoid route conflicts.
router.post('/upload-slip', protect, authorizeRoles('guest'), handleSlipUpload, uploadSlip);
router.post('/', protect, authorizeRoles('guest'), createPayment);
router.get('/', protect, authorizeRoles('admin'), getAllPayments);
router.get('/my', protect, authorizeRoles('guest'), getMyPayments);
router.get('/stats', protect, authorizeRoles('admin'), getPaymentStats);
router.get('/:id', protect, getPaymentById);
router.put('/:id/status', protect, authorizeRoles('admin'), updatePaymentStatus);
router.delete('/:id', protect, authorizeRoles('admin'), deletePayment);

module.exports = router;
