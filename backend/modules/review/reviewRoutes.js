// const express = require('express');
// const router = express.Router();

// // Placeholder — Member 1 will replace this with full routes
// router.get('/', (req, res) => res.json({ message: 'Review routes coming soon' }));

// module.exports = router;



const express = require('express');
const router = express.Router();

const {
  createReview,
  getAllReviews,
  getReviewsByRoom,
  getMyReviews,
  updateReview,
  deleteReview,
} = require('./reviewController');

const { protect } = require('../../middleware/authMiddleware');

// Public
router.get('/', getAllReviews);
router.get('/room/:roomId', getReviewsByRoom);

// Guest — must be logged in
router.post('/', protect, createReview);
router.get('/my', protect, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
