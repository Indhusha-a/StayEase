const PaymentService = require('./paymentService');
const fs = require('fs');
const cloudinary = require('../../config/cloudinary');

// ---------------------------------------------------------------------------
// paymentController.js
// ---------------------------------------------------------------------------
// Thin HTTP layer between the Express router and PaymentService.
// Each controller function's only jobs are:
//   1. Extract what it needs from req (body, params, user)
//   2. Call the corresponding PaymentService method
//   3. Return the result as JSON with the correct HTTP status
//   4. Catch errors and map them to the right status code
//
// Business logic (validation, ownership checks, DB queries) lives entirely
// in paymentService.js — not here. Controllers stay intentionally small.
// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------
// createPayment
// Route:  POST /payments
// Access: guest only (authorizeRoles('guest') in router)
// ---------------------------------------------------------------------------
// Reads bookingId, amount, paymentMethod, transactionReference, slipUrl, and
// notes from req.body. Passes them to PaymentService.createPayment() along
// with req.user._id (injected by the protect middleware after JWT verification)
// so the service can enforce that the guest only pays for their own booking.
//
// On success:  returns 201 Created with the new payment document.
// On failure:  uses error.status set by the service (400, 403, 404) if present,
//              falls back to 500 for unexpected errors.
// ---------------------------------------------------------------------------
const createPayment = async (req, res) => {
  try {
    const { bookingId, amount, paymentMethod, transactionReference, slipUrl, notes } = req.body;

    const payment = await PaymentService.createPayment({
      bookingId,
      amount,
      paymentMethod,
      transactionReference,
      slipUrl,
      notes,
      userId: req.user._id   // sourced from the decoded JWT, not from the request body
    });

    return res.status(201).json(payment);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};


// ---------------------------------------------------------------------------
// uploadSlip
// Route:  POST /payments/upload-slip
// Access: guest only
// ---------------------------------------------------------------------------
// Handles the two-step upload process for bank transfer proof-of-payment slips:
//   Step 1 — Multer (paymentSlipUploadMiddleware) has already run BEFORE this
//             controller is reached. It validated the file type (JPG/PNG/PDF),
//             enforced the 5MB size limit, and saved the file locally to
//             uploads/slips/ as req.file. If Multer rejected the file, Express
//             returns a 400 before this function is ever called.
//
//   Step 2 — This controller takes that local file and uploads it to Cloudinary,
//             then deletes the local copy in the finally block regardless of
//             whether the Cloudinary upload succeeded or failed.
//
// Guard: checks that all three Cloudinary env vars are present before attempting
// the upload. Returns a clear 500 error if any are missing so the problem is
// obvious in development rather than producing a cryptic Cloudinary SDK error.
//
// On success:  returns { slipUrl, fileName } where slipUrl is the Cloudinary
//              HTTPS URL. The client stores this and includes it when calling
//              POST /payments so the payment record links to the slip.
// On failure:  returns 500. The finally block still deletes the local file.
//
// Why finally for deletion:
//   The local file is a temporary artefact — it should never persist on the
//   server regardless of outcome. Using finally guarantees cleanup even if
//   Cloudinary throws, the env check fails, or any other error occurs.
// ---------------------------------------------------------------------------
const uploadSlip = async (req, res) => {
  let localFilePath = ''; // declared outside try so finally block can access it

  try {
    // Multer sets req.file if a file was successfully received and saved.
    // If it's missing, the request contained no file field at all.
    if (!req.file) {
      return res.status(400).json({ message: 'Slip file is required' });
    }

    // ── Cloudinary config guard ────────────────────────────────────────────
    // All three keys must be set in .env for the SDK to authenticate.
    // We check upfront so the error message names the missing variable(s)
    // instead of letting the Cloudinary SDK throw an opaque auth error.
    const requiredKeys = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET'
    ];
    const missingKeys = requiredKeys.filter((key) => !process.env[key]);

    if (missingKeys.length > 0) {
      return res.status(500).json({
        message: `Cloudinary is not configured on the server (missing: ${missingKeys.join(', ')})`
      });
    }

    // ── Cloudinary upload ─────────────────────────────────────────────────
    // req.file.path is the local disk path written by Multer.
    // Options:
    //   folder          — organises slips under stayease/slips in Cloudinary
    //   resource_type   — 'auto' handles both images and PDFs automatically
    //   use_filename    — keeps the sanitised original filename as a prefix
    //   unique_filename — appends a random suffix to prevent collisions
    localFilePath = req.file.path;
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      folder: 'stayease/slips',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });

    // Return the HTTPS URL (secure_url) — never the http variant (url).
    // The client stores slipUrl and sends it with POST /payments.
    return res.json({
      slipUrl: uploadResult.secure_url,
      fileName: req.file.originalname
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload slip', error: error.message });
  } finally {
    // ── Cleanup: delete the local temp file ───────────────────────────────
    // Runs whether the upload succeeded, failed, or an early return was hit.
    // fs.existsSync guards against calling unlink on an empty path (e.g. if
    // req.file was missing and localFilePath was never assigned).
    // The callback is a no-op — we don't need to handle deletion errors.
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, () => {});
    }
  }
};


// ---------------------------------------------------------------------------
// getAllPayments
// Route:  GET /payments
// Access: admin only
// ---------------------------------------------------------------------------
// Returns every payment record in the system, fully populated and sorted
// newest-first. Intended for the admin payments dashboard.
//
// Uses _req (underscore prefix) to signal that the request object is not
// needed — no filtering by user, no query params read.
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
// getMyPayments
// Route:  GET /payments/my
// Access: guest only
// ---------------------------------------------------------------------------
// Returns only the payments belonging to the currently authenticated guest.
// req.user._id is used as the filter — guests can never see each other's
// payment history because the JWT determines the userId, not a query param
// that could be tampered with.
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
// getPaymentById
// Route:  GET /payments/:id
// Access: any authenticated user (protect only — no role restriction)
// ---------------------------------------------------------------------------
// Retrieves a single payment by its MongoDB _id.
// Passes userId and userRole to the service so it can enforce the ownership
// rule: a guest may only view their own payment; an admin may view any.
// The authorisation check happens inside the service, not here.
//
// On success:  returns the populated payment document.
// On failure:  404 if not found, 403 if the caller does not own the payment.
// ---------------------------------------------------------------------------
const getPaymentById = async (req, res) => {
  try {
    const payment = await PaymentService.getPaymentById({
      paymentId: req.params.id,
      userId: req.user._id,
      userRole: req.user.role  // 'guest' or 'admin' — set by protect middleware
    });

    return res.json(payment);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};


// ---------------------------------------------------------------------------
// updatePaymentStatus
// Route:  PUT /payments/:id/status
// Access: admin only
// ---------------------------------------------------------------------------
// Allows an admin to advance a payment's status to 'Paid' or issue a
// 'Refunded' status. The service enforces:
//   - Only 'Paid' and 'Refunded' are valid target values (400 otherwise)
//   - A payment already in 'Refunded' state cannot be changed again (terminal)
//
// On success:  returns the updated payment document.
// On failure:  400 for invalid status or terminal-state violation, 404 if
//              the payment does not exist.
// ---------------------------------------------------------------------------
const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await PaymentService.updatePaymentStatus({
      paymentId: req.params.id,
      status: req.body.status  // expected: 'Paid' or 'Refunded'
    });

    return res.json(payment);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};


// ---------------------------------------------------------------------------
// deletePayment
// Route:  DELETE /payments/:id
// Access: admin only
// ---------------------------------------------------------------------------
// Permanently removes a payment record. The service restricts deletion to
// payments in 'Paid' or 'Refunded' status — 'Pending' payments cannot be
// deleted to preserve the audit trail while a transaction is still active.
//
// On success:  returns a { message: 'Payment deleted successfully' } confirmation.
// On failure:  404 if not found, 400 if the payment is still Pending.
// ---------------------------------------------------------------------------
const deletePayment = async (req, res) => {
  try {
    await PaymentService.deletePayment({ paymentId: req.params.id });
    return res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};


// ---------------------------------------------------------------------------
// getPaymentStats
// Route:  GET /payments/stats
// Access: admin only
// ---------------------------------------------------------------------------
// Returns aggregated revenue totals grouped by payment status:
//   { Pending: { totalAmount, count }, Paid: { ... }, Refunded: { ... } }
//
// The service pre-seeds all three statuses with zeros so the response shape
// is always consistent — the admin dashboard never needs to check for missing
// keys before rendering the revenue summary cards.
//
// Uses _req (no request data needed — stats cover the full collection).
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
  uploadSlip,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
  getPaymentStats
};