const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking
} = require('./bookingController');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');

router.get('/my', protect, getMyBookings);
router.put('/:id/cancel', protect, cancelBooking);
router.put('/:id/status', protect, authorizeRoles('admin'), updateBookingStatus);
router.get('/:id', protect, getBookingById);

router.post('/', protect, createBooking);
router.get('/', protect, authorizeRoles('admin'), getAllBookings);

module.exports = router;