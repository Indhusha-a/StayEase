const paymentService = require('./paymentService');

// Handles payment creation requests from guests.
const createPayment = async (req, res) => {
  try {
    const payment = await paymentService.createPayment({
      ...req.body,
      userId: req.user._id
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Returns all payments for the admin payment management view.
const getAllPayments = async (_req, res) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.json(payments);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Returns only the authenticated user's payments.
const getMyPayments = async (req, res) => {
  try {
    const payments = await paymentService.getMyPayments(req.user._id);
    res.json(payments);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Returns a single payment when the user owns it or is an admin.
const getPaymentById = async (req, res) => {
  try {
    const payment = await paymentService.getPaymentById({
      paymentId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role
    });
    res.json(payment);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Allows admins to update a payment to a supported final status.
const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await paymentService.updatePaymentStatus({
      paymentId: req.params.id,
      status: req.body.status
    });
    res.json(payment);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// Returns aggregated payment totals for the revenue summary screen.
const getPaymentStats = async (_req, res) => {
  try {
    const summary = await paymentService.getPaymentStats();
    res.json(summary);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
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
