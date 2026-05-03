const mongoose = require('mongoose');

// ---------------------------------------------------------------------------
// paymentSchema
// ---------------------------------------------------------------------------
// Stores one payment record per booking.
//
// Relationships:
//   bookingId -> booking being paid
//   userId    -> guest who submitted the payment
//
// Lifecycle:
//   Pending -> initial state
//   Paid / Refunded -> later admin-managed states
// ---------------------------------------------------------------------------
const paymentSchema = new mongoose.Schema(
  {
    // Booking this payment belongs to.
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    // Guest who created the payment.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // Amount charged for the booking.
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    // Display label such as Cash, Online Pay, or Bank Transfer.
    paymentMethod: {
      type: String,
      required: true,
      trim: true
    },
    // Optional reference entered manually or generated for online pay.
    transactionReference: {
      type: String,
      trim: true,
      default: ''
    },
    // Optional uploaded bank-slip URL stored after Cloudinary upload.
    slipUrl: {
      type: String,
      trim: true,
      default: ''
    },
    // Optional note saved with the payment record.
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    // Workflow state used across guest and admin payment screens.
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending'
    },
    // User-facing payment timestamp shown in history/receipt UIs.
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  // Adds createdAt / updatedAt for auditing and admin visibility.
  { timestamps: true }
);

// Reuse the compiled model during hot reload to avoid overwrite errors.
module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
