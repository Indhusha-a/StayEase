const express  = require('express');
const router   = express.Router();
const { createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom, getAvailableRooms } = require('./roomController');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');
const upload   = require('../../middleware/uploadMiddleware');

// Public — anyone can browse and check availability
router.get('/',           getAllRooms);
router.get('/available',  getAvailableRooms);
router.get('/:id',        getRoomById);

// Admin only — create, update, delete
router.post('/',    protect, authorizeRoles('admin'), upload.single('image'), createRoom);
router.put('/:id',  protect, authorizeRoles('admin'), upload.single('image'), updateRoom);
router.delete('/:id', protect, authorizeRoles('admin'), deleteRoom);

module.exports = router;