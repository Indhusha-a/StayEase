const mongoose = require('mongoose');
const Payment = require('./paymentModel');

const Booking = mongoose.models.Booking || mongoose.model(
  'Booking',
  new mongoose.Schema(
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      status: { type: String, required: true }
    },
    { strict: false }
  )
);

// Creates a payment after validating the booking and payment ownership rules.
const createPayment = async ({ bookingId, amount, paymentMethod, transactionReference, notes, userId }) => {
  if (!bookingId || !amount || !paymentMethod) {
    const error = new Error('bookingId, amount and paymentMethod are required');
    error.status = 400;
    throw error;
  }

  const booking = await Booking.findById(bookingId).lean();
  if (!booking) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }

  if (booking.status !== 'Approved') {
    const error = new Error('Payment is allowed only for approved bookings');
    error.status = 400;
    throw error;
  }

  if (booking.userId.toString() !== userId.toString()) {
    const error = new Error('You can only pay for your own bookings');
    error.status = 403;
    throw error;
  }

  return Payment.create({
    bookingId,
    userId,
    amount,
    paymentMethod,
    transactionReference,
    notes
  });
};

// Returns every payment with booking and user details for admin views.
const getAllPayments = async () => Payment.find()
  .populate('bookingId')
  .populate('userId', 'name email role')
  .sort({ paymentDate: -1 });

// Returns the logged-in user's payment history.
const getMyPayments = async (userId) => Payment.find({ userId })
  .populate('bookingId')
  .sort({ paymentDate: -1 });

// Returns a single payment and enforces owner/admin visibility.
const getPaymentById = async ({ paymentId, userId, userRole }) => {
  const payment = await Payment.findById(paymentId)
    .populate('bookingId')
    .populate('userId', 'name email role');

  if (!payment) {
    const error = new Error('Payment not found');
    error.status = 404;
    throw error;
  }

  const isOwner = payment.userId._id.toString() === userId.toString();
  const isAdmin = userRole === 'admin';
  if (!isOwner && !isAdmin) {
    const error = new Error('Not authorized to view this payment');
    error.status = 403;
    throw error;
  }

  return payment;
};

// Updates the payment status while restricting it to supported values.
const updatePaymentStatus = async ({ paymentId, status }) => {
  if (!['Paid', 'Refunded'].includes(status)) {
    const error = new Error("Status must be either 'Paid' or 'Refunded'");
    error.status = 400;
    throw error;
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error('Payment not found');
    error.status = 404;
    throw error;
  }

  payment.status = status;
  await payment.save();
  return payment;
};

// Aggregates payment totals and counts by status for reporting.
const getPaymentStats = async () => {
  const byStatus = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  const summary = {
    Pending: { totalAmount: 0, count: 0 },
    Paid: { totalAmount: 0, count: 0 },
    Refunded: { totalAmount: 0, count: 0 }
  };

  byStatus.forEach((row) => {
    summary[row._id] = { totalAmount: row.totalAmount, count: row.count };
  });

  return summary;
};

module.exports = {
  createPayment,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats
};
