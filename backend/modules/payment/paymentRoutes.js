const express = require('express');
const router = express.Router();

const {
  createPayment,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats
} = require('./paymentController');

const { protect, authorizeRoles } = require('../../middleware/authMiddleware');

// Keep static routes above '/:id' to avoid route conflicts.
router.post('/', protect, authorizeRoles('guest'), createPayment);
router.get('/', protect, authorizeRoles('admin'), getAllPayments);
router.get('/my', protect, authorizeRoles('guest'), getMyPayments);
router.get('/stats', protect, authorizeRoles('admin'), getPaymentStats);
router.get('/:id', protect, getPaymentById);
router.put('/:id/status', protect, authorizeRoles('admin'), updatePaymentStatus);

module.exports = router;
