const mongoose = require('mongoose');
const Payment = require('./paymentModel');

// Reuse the Booking model if it already exists.
const Booking =
  mongoose.models.Booking ||
  mongoose.model(
    'Booking',
    new mongoose.Schema(
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        status: { type: String, required: true }
      },
      { strict: false }
    )
  );

const makeError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const createPayment = async ({
  bookingId,
  amount,
  paymentMethod,
  transactionReference,
  slipUrl,
  notes,
  userId
}) => {
  if (!bookingId || !amount || !paymentMethod) {
    throw makeError('bookingId, amount, and paymentMethod are required', 400);
  }

  if (amount <= 0) {
    throw makeError('Amount must be greater than zero', 400);
  }

  const booking = await Booking.findById(bookingId).lean();
  if (!booking) {
    throw makeError('Booking not found', 404);
  }

  if (booking.status !== 'Approved') {
    throw makeError('Payment is only allowed for approved bookings', 400);
  }

  if (booking.userId.toString() !== userId.toString()) {
    throw makeError('You can only pay for your own bookings', 403);
  }

  const existing = await Payment.findOne({ bookingId });
  if (existing) {
    throw makeError('A payment for this booking already exists', 400);
  }

  return Payment.create({
    bookingId,
    userId,
    amount,
    paymentMethod,
    transactionReference,
    slipUrl,
    notes
  });
};

const getAllPayments = async () =>
  Payment.find()
    .populate('bookingId')
    .populate('userId', 'name email role')
    .sort({ paymentDate: -1 });

const getMyPayments = async (userId) =>
  Payment.find({ userId })
    .populate('bookingId')
    .sort({ paymentDate: -1 });

// Allow only the payment owner or an admin to view a payment.
const getPaymentById = async ({ paymentId, userId, userRole }) => {
  const payment = await Payment.findById(paymentId)
    .populate('bookingId')
    .populate('userId', 'name email role');

  if (!payment) {
    throw makeError('Payment not found', 404);
  }

  const isOwner = payment.userId._id.toString() === userId.toString();
  const isAdmin = userRole === 'admin';

  if (!isOwner && !isAdmin) {
    throw makeError('Not authorized to view this payment', 403);
  }

  return payment;
};

const updatePaymentStatus = async ({ paymentId, status }) => {
  if (!['Paid', 'Refunded'].includes(status)) {
    throw makeError("Status must be either 'Paid' or 'Refunded'", 400);
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw makeError('Payment not found', 404);
  }

  if (payment.status === 'Refunded') {
    throw makeError('Cannot change the status of an already refunded payment', 400);
  }

  payment.status = status;
  await payment.save();

  return payment;
};

const deletePayment = async ({ paymentId }) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw makeError('Payment not found', 404);
  }

  if (!['Paid', 'Refunded'].includes(payment.status)) {
    throw makeError("Only payments with 'Paid' or 'Refunded' status can be deleted", 400);
  }

  await payment.deleteOne();
};

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
  deletePayment,
  getPaymentStats
};
