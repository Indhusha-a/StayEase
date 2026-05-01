const PaymentService = require('./paymentService');

// Create a payment for an approved booking.
const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, transactionReference, notes } = req.body;

    const payment = await PaymentService.createPayment({
      bookingId,
      amount,
      paymentMethod,
      transactionReference,
      notes,
      userId: req.user._id
    });

    return res.status(201).json(payment);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

// Get all payments for admins.
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

// Get payments for the logged-in user.
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

// Get one payment by ID.
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

// Update a payment status.
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

// Get payment summary stats.
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
