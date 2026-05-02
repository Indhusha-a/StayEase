const PaymentService = require('./paymentService');
const fs = require('fs');
const cloudinary = require('../../config/cloudinary');

// Create a payment for an approved booking.
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
      userId: req.user._id
    });

    return res.status(201).json(payment);
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({ message: error.message });
  }
};

// Upload a bank transfer slip for guest payments.
const uploadSlip = async (req, res) => {
  let localFilePath = '';

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Slip file is required' });
    }

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

    localFilePath = req.file.path;
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      folder: 'stayease/slips',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    });

    return res.json({
      slipUrl: uploadResult.secure_url,
      fileName: req.file.originalname
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload slip', error: error.message });
  } finally {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, () => {});
    }
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
  uploadSlip,
  getAllPayments,
  getMyPayments,
  getPaymentById,
  updatePaymentStatus,
  getPaymentStats
};
