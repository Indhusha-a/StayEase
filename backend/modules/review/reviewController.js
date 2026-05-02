const fs = require('fs');
const Review = require('./reviewModel');
const Booking = require('../booking/bookingModel');
const Payment = require('../payment/paymentModel');
const cloudinary = require('../../config/cloudinary');

const getReviewEligibilityForUser = async ({ userId, roomId }) => {
  const existingReview = await Review.findOne({ userId, roomId }).lean();
  if (existingReview) {
    return {
      canReview: false,
      status: 400,
      message: 'You have already reviewed this room'
    };
  }

  const approvedBookings = await Booking.find({
    userId,
    roomId,
    status: 'Approved'
  })
    .select('_id')
    .lean();

  if (!approvedBookings.length) {
    return {
      canReview: false,
      status: 403,
      message: 'Complete an approved booking for this room before leaving a review'
    };
  }

  const approvedBookingIds = approvedBookings.map((booking) => booking._id);
  const confirmedPayment = await Payment.findOne({
    userId,
    bookingId: { $in: approvedBookingIds },
    status: 'Paid'
  })
    .select('_id')
    .lean();

  if (!confirmedPayment) {
    return {
      canReview: false,
      status: 403,
      message: 'You can review this room after your payment is confirmed by admin'
    };
  }

  return {
    canReview: true,
    status: 200,
    message: 'You can review this room'
  };
};

// POST /api/reviews — Guest submits a new review
const createReview = async (req, res) => {
  try {
    const { roomId, rating, title, comment, imageUrl } = req.body;

    // Validate required fields
    if (!roomId || !rating || !title || !comment) {
      return res.status(400).json({ message: 'roomId, rating, title, and comment are required' });
    }

    const eligibility = await getReviewEligibilityForUser({
      userId: req.user._id,
      roomId
    });

    if (!eligibility.canReview) {
      return res.status(eligibility.status).json({ message: eligibility.message });
    }

    const review = await Review.create({
      userId: req.user._id,
      roomId,
      rating,
      title,
      comment,
      imageUrl: imageUrl?.trim() || '',
    });

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/reviews/upload-image — Upload a review image before creating/updating a review
const uploadReviewImage = async (req, res) => {
  let localFilePath = '';

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Review image file is required' });
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
      folder: 'stayease/reviews',
      resource_type: 'image',
      use_filename: true,
      unique_filename: true
    });

    return res.json({
      imageUrl: uploadResult.secure_url,
      fileName: req.file.originalname
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to upload review image', error: error.message });
  } finally {
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlink(localFilePath, () => {});
    }
  }
};

// GET /api/reviews — Public: get all reviews
const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('userId', 'name')
      .populate('roomId', 'roomNumber roomType')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/reviews/room/:roomId — Public: reviews for a specific room + average rating
const getReviewsByRoom = async (req, res) => {
  try {
    const reviews = await Review.find({ roomId: req.params.roomId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      count: reviews.length,
      averageRating: parseFloat(averageRating.toFixed(1)),
      reviews,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/reviews/eligibility/:roomId — Guest: whether the user can review this room
const getReviewEligibility = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) {
      return res.status(400).json({ canReview: false, message: 'roomId is required' });
    }

    const eligibility = await getReviewEligibilityForUser({
      userId: req.user._id,
      roomId
    });

    return res.json({
      canReview: eligibility.canReview,
      message: eligibility.message
    });
  } catch (err) {
    return res.status(500).json({
      canReview: false,
      message: 'Could not check review eligibility',
      error: err.message
    });
  }
};

// GET /api/reviews/my — Guest: get own reviews
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate('roomId', 'roomNumber roomType')
      .sort({ createdAt: -1 });

    res.status(200).json({ count: reviews.length, reviews });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/reviews/:id — Guest: edit own review
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Ownership check
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorised to edit this review' });
    }

    const { rating, title, comment, imageUrl } = req.body;

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
    if (imageUrl !== undefined) review.imageUrl = imageUrl ? imageUrl.trim() : '';
    review.updatedAt = Date.now();

    await review.save();

    res.status(200).json({ message: 'Review updated successfully', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/reviews/:id — Guest (own) or Admin
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const isOwner = review.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorised to delete this review' });
    }

    await review.deleteOne();

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  createReview,
  uploadReviewImage,
  getAllReviews,
  getReviewsByRoom,
  getReviewEligibility,
  getMyReviews,
  updateReview,
  deleteReview,
};
