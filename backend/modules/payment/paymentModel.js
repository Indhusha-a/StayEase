const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true
    },
    transactionReference: {
      type: String,
      trim: true,
      default: ''
    },
    slipUrl: {
      type: String,
      trim: true,
      default: ''
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
