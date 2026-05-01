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

// ---------------------------------------------------------------------------
// Route ordering is critical in Express.
//
// Express matches routes top-to-bottom and stops at the first match.
// '/my' and '/stats' must come BEFORE '/:id', otherwise Express will
// capture the literal strings "my" and "stats" as the :id parameter
// and route to the wrong handler entirely.
// ---------------------------------------------------------------------------

// POST   /api/payments
// Guest submits a payment for their approved booking
router.post('/', protect, authorizeRoles('guest'), createPayment);

// GET    /api/payments
// Admin retrieves the full payment ledger across all users
router.get('/', protect, authorizeRoles('admin'), getAllPayments);

// GET    /api/payments/my
// Guest retrieves their own payment history
// Must be above /:id — see ordering note above
router.get('/my', protect, authorizeRoles('guest'), getMyPayments);

// GET    /api/payments/stats
// Admin retrieves revenue totals grouped by payment status
// Must be above /:id — see ordering note above
router.get('/stats', protect, authorizeRoles('admin'), getPaymentStats);

// GET    /api/payments/:id
// Owner or Admin retrieves a single payment's full details
router.get('/:id', protect, getPaymentById);

// PUT    /api/payments/:id/status
// Admin updates a payment to Paid or Refunded
router.put('/:id/status', protect, authorizeRoles('admin'), updatePaymentStatus);

module.exports = router;