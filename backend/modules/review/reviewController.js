const Review = require('./reviewModel');

// POST /api/reviews — Guest submits a new review
const createReview = async (req, res) => {
  try {
    const { roomId, rating, title, comment } = req.body;

    // Validate required fields
    if (!roomId || !rating || !title || !comment) {
      return res.status(400).json({ message: 'roomId, rating, title, and comment are required' });
    }

    // One review per room per user
    const existing = await Review.findOne({ userId: req.user._id, roomId });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this room' });
    }

    const review = await Review.create({
      userId: req.user._id,
      roomId,
      rating,
      title,
      comment,
    });

    res.status(201).json({ message: 'Review submitted successfully', review });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
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

    const { rating, title, comment } = req.body;

    if (rating !== undefined) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;
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

    // Allow if owner or admin
    const isOwner = review.userId.toString() === req.user._id.toString();
  

    if (!isOwner) {
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
  getAllReviews,
  getReviewsByRoom,
  getMyReviews,
  updateReview,
  deleteReview,
};
