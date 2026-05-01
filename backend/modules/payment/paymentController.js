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

const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, transactionReference, notes } = req.body;

    if (!bookingId || !amount || !paymentMethod) {
      return res.status(400).json({ message: 'bookingId, amount and paymentMethod are required' });
    }

    const booking = await Booking.findById(bookingId).lean();
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'Approved') {
      return res.status(400).json({ message: 'Payment is allowed only for approved bookings' });
    }

    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only pay for your own bookings' });
    }

    const payment = await Payment.create({
      bookingId,
      userId: req.user._id,
      amount,
      paymentMethod,
      transactionReference,
      notes
    });

    return res.status(201).json(payment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create payment', error: error.message });
  }
};

const getAllPayments = async (_req, res) => {
  try {
    const payments = await Payment.find()
      .populate('bookingId')
      .populate('userId', 'name email role')
      .sort({ paymentDate: -1 });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payments', error: error.message });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('bookingId')
      .sort({ paymentDate: -1 });
    return res.json(payments);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch your payments', error: error.message });
  }
};

const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('bookingId')
      .populate('userId', 'name email role');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const isOwner = payment.userId._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    return res.json(payment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payment', error: error.message });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Paid', 'Refunded'].includes(status)) {
      return res.status(400).json({ message: "Status must be either 'Paid' or 'Refunded'" });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    payment.status = status;
    await payment.save();
    return res.json(payment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update payment status', error: error.message });
  }
};

const getPaymentStats = async (_req, res) => {
  try {
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

    return res.json(summary);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch payment stats', error: error.message });
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
