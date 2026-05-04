const express = require('express');
const router = express.Router();

// Controller actions for payment CRUD, status updates, stats, and slip upload.
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

// ---------------------------------------------------------------------------
// handleSlipUpload
// ---------------------------------------------------------------------------
// Wraps the Multer middleware so upload validation failures return a clean
// JSON response instead of bubbling into a generic error handler.
//
// Expected multipart field name: "slip"
// ---------------------------------------------------------------------------
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

// Keep static routes above '/:id' to avoid route conflicts with Express.
// Each route applies auth/role guards at the router level.
router.post('/upload-slip', protect, authorizeRoles('guest'), handleSlipUpload, uploadSlip);
router.post('/', protect, authorizeRoles('guest'), createPayment);
router.get('/', protect, authorizeRoles('admin'), getAllPayments);
router.get('/my', protect, authorizeRoles('guest'), getMyPayments);
router.get('/stats', protect, authorizeRoles('admin'), getPaymentStats);
router.get('/:id', protect, getPaymentById);
router.put('/:id/status', protect, authorizeRoles('admin'), updatePaymentStatus);
router.delete('/:id', protect, authorizeRoles('admin'), deletePayment);

module.exports = router;
