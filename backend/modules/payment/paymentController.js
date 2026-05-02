const PaymentService = require('./paymentService');

// ---------------------------------------------------------------------------
// Each controller method is a thin HTTP adapter:
//   1. Extract what the service needs from req
//   2. Call the service
//   3. Map the result (or error) to an HTTP response
//
// Business logic lives entirely in paymentService.js — controllers should
// not duplicate validation or database access.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// @desc    Create a new payment for an approved booking
// @route   POST /api/payments
// @access  Private — Guest only
// ---------------------------------------------------------------------------
const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, transactionReference, notes } = req.body;

    const payment = await PaymentService.createPayment({
      bookingId,
      amount,
      paymentMethod,
      transactionReference,
      notes,
      userId: req.user._id  // Injected by auth middleware; never trust the request body
    });

    return res.status(201).json(payment);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get all payments across all users
// @route   GET /api/payments
// @access  Private — Admin only
// ---------------------------------------------------------------------------
const getAllPayments = async (_req, res) => {
  try {
    const payments = await PaymentService.getAllPayments();
    return res.json(payments);
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch payments', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get all payments belonging to the logged-in guest
// @route   GET /api/payments/my
// @access  Private — Guest only
// ---------------------------------------------------------------------------
const getMyPayments = async (req, res) => {
  try {
    const payments = await PaymentService.getMyPayments(req.user._id);
    return res.json(payments);
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch your payments', error: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get a single payment by ID
// @route   GET /api/payments/:id
// @access  Private — Owner or Admin
// ---------------------------------------------------------------------------
const getPaymentById = async (req, res) => {
  try {
    const payment = await PaymentService.getPaymentById({
      paymentId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role
    });

    return res.json(payment);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Update a payment's status to Paid or Refunded
// @route   PUT /api/payments/:id/status
// @access  Private — Admin only
// ---------------------------------------------------------------------------
const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await PaymentService.updatePaymentStatus({
      paymentId: req.params.id,
      status: req.body.status
    });

    return res.json(payment);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

// ---------------------------------------------------------------------------
// @desc    Get revenue summary grouped by payment status
// @route   GET /api/payments/stats
// @access  Private — Admin only
// ---------------------------------------------------------------------------
const getPaymentStats = async (_req, res) => {
  try {
    const summary = await PaymentService.getPaymentStats();
    return res.json(summary);
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Failed to fetch payment stats', error: error.message });
  }
};

module.exports = {
  createPayment,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats
};