const mongoose = require('mongoose');
const Payment = require('./paymentModel');

// ---------------------------------------------------------------------------
// Booking model — safe cross-module reference
//
// We check mongoose.models first to avoid an OverwriteModelError if Member 2's
// Booking module has already registered the model in this process.
// The fallback schema uses strict: false so any fields defined in the real
// schema remain readable even though we only declare the two we validate here.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helper — builds a structured error that controllers can map to HTTP codes.
// Keeping error construction in one place makes it easy to swap to a custom
// AppError class later without touching every throw site.
// ---------------------------------------------------------------------------
const makeError = (message, status) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// ---------------------------------------------------------------------------
// createPayment
// Validates inputs, enforces booking rules, and persists a new payment.
//
// Guards (in order)dsdsds
//  1. Required-field presence
//  2. Positive amount
//  3. Booking exists 
//  4. Booking is Approved
//  5. Guest owns the booking
//  6. No existing payment for this booking (prevents duplicate charges)
// ---------------------------------------------------------------------------
const createPayment = async ({
  bookingId,
  amount,
  paymentMethod,
  transactionReference,
  notes,
  userId
}) => {
  // --- 1. Required fields ---
  if (!bookingId || !amount || !paymentMethod) {
    throw makeError('bookingId, amount, and paymentMethod are required', 400);
  }

  // --- 2. Amount sanity check ---
  if (amount <= 0) {
    throw makeError('Amount must be greater than zero', 400);
  }

  // --- 3. Booking must exist ---
  const booking = await Booking.findById(bookingId).lean();
  if (!booking) {
    throw makeError('Booking not found', 404);
  }

  // --- 4. Only Approved bookings can be paid ---
  if (booking.status !== 'Approved') {
    throw makeError('Payment is only allowed for approved bookings', 400);
  }

  // --- 5. Guest can only pay for their own booking ---
  if (booking.userId.toString() !== userId.toString()) {
    throw makeError('You can only pay for your own bookings', 403);
  }

  // --- 6. Prevent a second payment for the same booking ---
  const existing = await Payment.findOne({ bookingId });
  if (existing) {
    throw makeError('A payment for this booking already exists', 400);
  }

  // All checks passed — create and return the new payment record
  return Payment.create({
    bookingId,
    userId,
    amount,
    paymentMethod,
    transactionReference,
    notes
  });
};

// ---------------------------------------------------------------------------
// getAllPayments
// Returns every payment record, fully populated, newest first.
// Intended for admin dashboards where a complete ledger view is needed.
// ---------------------------------------------------------------------------
const getAllPayments = async () =>
  Payment.find()
    .populate('bookingId')                      // Full booking document
    .populate('userId', 'name email role')      // Limit user fields for privacy
    .sort({ paymentDate: -1 });

// ---------------------------------------------------------------------------
// getMyPayments
// Returns only the payments belonging to the requesting guest.
// Does not expose other users' financial data.
// ---------------------------------------------------------------------------
const getMyPayments = async (userId) =>
  Payment.find({ userId })
    .populate('bookingId')       // Includes room and date info for receipt display
    .sort({ paymentDate: -1 });

// ---------------------------------------------------------------------------
// getPaymentById
// Returns a single payment, enforcing that only the owner or an admin can see it.
//
// Note: payment.userId is a populated object after .populate(), so we access
// ._id explicitly to get the raw ObjectId for comparison.
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// updatePaymentStatus
// Allows an admin to advance a payment to Paid or issue a Refunded status.
//
// Rules:
//  - Only 'Paid' and 'Refunded' are valid target statuses
//  - A Refunded payment is terminal — it cannot be changed again
// ---------------------------------------------------------------------------
const updatePaymentStatus = async ({ paymentId, status }) => {
  // --- Validate the requested status value ---
  if (!['Paid', 'Refunded'].includes(status)) {
    throw makeError("Status must be either 'Paid' or 'Refunded'", 400);
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw makeError('Payment not found', 404);
  }

  // --- Refunded is a terminal state; block any further changes ---
  if (payment.status === 'Refunded') {
    throw makeError('Cannot change the status of an already refunded payment', 400);
  }

  payment.status = status;
  await payment.save(); // Triggers updatedAt via timestamps option

  return payment;
};

// ---------------------------------------------------------------------------
// getPaymentStats
// Aggregates total revenue and record count grouped by payment status.
//
// The summary object is pre-seeded with all three statuses so the frontend
// always receives the same shape — no conditional key checks needed client-side.
// ---------------------------------------------------------------------------
const getPaymentStats = async () => {
  const byStatus = await Payment.aggregate([
    {
      $group: {
        _id: '$status',             // Group key
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  // Default shape — ensures missing statuses still appear as zero rather than
  // being absent from the response
  const summary = {
    Pending:  { totalAmount: 0, count: 0 },
    Paid:     { totalAmount: 0, count: 0 },
    Refunded: { totalAmount: 0, count: 0 }
  };

  // Merge real DB values into the defaults
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