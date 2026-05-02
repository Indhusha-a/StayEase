const express = require('express');
const router = express.Router();
const {
    submitComplaint,
    getAllComplaints,
    getMyComplaints,
    getComplaintById,
    updateComplaintStatus,
    deleteComplaint,
    uploadEvidenceImage,
    updateOwnComplaint,
    deleteOwnComplaint,
    getComplaintStats,
} = require('./complaintController');
const { protect, authorizeRoles } = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

// All routes are protected
router.use(protect);

// @route   POST /api/complaints
// @desc    Submit a new complaint (Guest or Staff)
router.post('/', submitComplaint);

// @route   GET /api/complaints
// @desc    Get all complaints (Admin only)
router.get('/', authorizeRoles('admin'), getAllComplaints);

// @route   GET /api/complaints/stats
// @desc    Get complaint statistics (Admin only)
router.get('/stats', authorizeRoles('admin'), getComplaintStats);

// @route   GET /api/complaints/my
// @desc    Get current user's complaints (Guest or Staff)
router.get('/my', getMyComplaints);

// @route   GET /api/complaints/:id
// @desc    Get single complaint by ID
router.get('/:id', getComplaintById);

// @route   PUT /api/complaints/:id/status
// @desc    Update complaint status (Admin only)
// NOTE: This must come BEFORE the generic /:id route to avoid conflicts
router.put('/:id/status', authorizeRoles('admin'), updateComplaintStatus);

// @route   PUT /api/complaints/:id
// @desc    Update own complaint (Owner only, status must be Open)
router.put('/:id', updateOwnComplaint);

// @route   DELETE /api/complaints/:id
// @desc    Delete complaint (Owner if Open, Admin always)
router.delete('/:id', deleteOwnComplaint);

// @route   POST /api/complaints/:id/image
// @desc    Upload evidence image for complaint
router.post('/:id/image', upload.single('evidenceImage'), uploadEvidenceImage);

module.exports = router;