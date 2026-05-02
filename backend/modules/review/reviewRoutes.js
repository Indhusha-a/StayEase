// const express = require('express');
// const router = express.Router();

// // Placeholder — Member 1 will replace this with full routes
// router.get('/', (req, res) => res.json({ message: 'Review routes coming soon' }));

// module.exports = router;



const express = require('express');
const router = express.Router();

const {
  createReview,
  uploadReviewImage,
  getAllReviews,
  getReviewsByRoom,
  getReviewEligibility,
  getMyReviews,
  updateReview,
  deleteReview,
} = require('./reviewController');

const reviewImageUpload = require('../../middleware/reviewImageUploadMiddleware');
const { protect } = require('../../middleware/authMiddleware');

const handleReviewImageUpload = (req, res, next) => {
  reviewImageUpload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Review image must be 5MB or smaller' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Public
router.get('/', getAllReviews);
router.get('/room/:roomId', getReviewsByRoom);

// Guest — must be logged in
router.get('/eligibility/:roomId', protect, getReviewEligibility);
router.post('/upload-image', protect, handleReviewImageUpload, uploadReviewImage);
router.post('/', protect, createReview);
router.get('/my', protect, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
