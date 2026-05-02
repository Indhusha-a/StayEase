const Complaint = require('./complaintModel');

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Guest, Staff
const submitComplaint = async (req, res) => {
  try {
    console.log('Submitting complaint with data:', req.body);
    console.log('User from token:', req.user);

    const { type, title, description, priority, roomId } = req.body;

    // Validation
    if (!type || !title || !description) {
      return res.status(400).json({
        message: 'Please provide type, title, and description',
        received: { type, title, description }
      });
    }

    // Create complaint
    const complaintData = {
      reportedBy: req.user._id,
      type,
      title,
      description,
      priority: priority || 'Low',
      status: 'Open',
    };

    // Only add roomId if provided
    if (roomId) {
      complaintData.roomId = roomId;
    }

    const complaint = new Complaint(complaintData);
    await complaint.save();

    console.log('Complaint created:', complaint._id);

    // Populate user details
    await complaint.populate('reportedBy', 'name email role');

    res.status(201).json({
      success: true,
      complaint,
      message: 'Complaint submitted successfully.',
    });
  } catch (error) {
    console.error('Submit complaint error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      message: 'Server error',
      error: error.message,
      stack: error.stack
    });
  }
};

// @desc    Get all complaints (Admin only)
// @route   GET /api/complaints
// @access  Admin
const getAllComplaints = async (req, res) => {
  try {
    // Build query with optional filters
    let query = {};

    // Optional filters from query string
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.type) {
      query.type = req.query.type;
    }

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'name email role')
      .populate('roomId', 'roomNumber roomType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Get all complaints error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get current user's complaints
// @route   GET /api/complaints/my
// @access  Guest, Staff
const getMyComplaints = async (req, res) => {
  try {
    let query = { reportedBy: req.user._id };

    // Optional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    const complaints = await Complaint.find(query)
      .populate('reportedBy', 'name email role')
      .populate('roomId', 'roomNumber roomType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: complaints.length,
      complaints,
    });
  } catch (error) {
    console.error('Get my complaints error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
const getComplaintById = async (req, res) => {
  try {
    // Validate ObjectId format before querying
    const { Types } = require('mongoose');
    if (!Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint ID format' });
    }

    const complaint = await Complaint.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('roomId', 'roomNumber roomType');

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check authorization - only admin or the person who submitted can view
    // Handle case where reportedBy might be null or not populated
    if (!complaint.reportedBy) {
      return res.status(404).json({ message: 'Complaint reporter not found' });
    }
    const reporterId = complaint.reportedBy._id || complaint.reportedBy;
    if (
      req.user.role !== 'admin' &&
      reporterId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this complaint' });
    }

    res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Get complaint by ID error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update complaint status and assign staff
// @route   PUT /api/complaints/:id/status
// @access  Admin
const updateComplaintStatus = async (req, res) => {
  try {
    const { status, assignedTo, response } = req.body;

    if (status && !['Open', 'In Progress', 'Resolved', 'Closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Update fields
    if (status) {
      complaint.status = status;
      // Auto-set resolvedAt when status is Resolved
      if (status === 'Resolved') {
        complaint.resolvedAt = new Date();
      }
    }
    if (assignedTo !== undefined) {
      complaint.assignedTo = assignedTo;
    }
    if (response) {
      complaint.adminResponse = response;
    }

    await complaint.save();
    await complaint.populate('reportedBy', 'name email role');

    res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Update complaint status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Admin
const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    await complaint.deleteOne();

    res.json({
      success: true,
      message: 'Complaint removed',
    });
  } catch (error) {
    console.error('Delete complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update own complaint (edit by owner)
// @route   PUT /api/complaints/:id
// @access  Guest, Staff (owner only)
const updateOwnComplaint = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user is the owner - handle case where reportedBy might be null
    if (!complaint.reportedBy) {
      return res.status(404).json({ message: 'Complaint reporter not found' });
    }
    const reporterId = complaint.reportedBy._id || complaint.reportedBy;
    if (reporterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this complaint' });
    }

    // Only allow editing if status is Open
    if (complaint.status !== 'Open') {
      return res.status(400).json({ message: 'Cannot edit complaint that is not Open' });
    }

    // Update fields
    if (title) complaint.title = title;
    if (description) complaint.description = description;
    if (priority) complaint.priority = priority;

    await complaint.save();
    await complaint.populate('reportedBy', 'name email role');

    res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Update own complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete own complaint (by owner)
// @route   DELETE /api/complaints/:id
// @access  Guest, Staff (owner only)
const deleteOwnComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check if user is the owner - handle case where reportedBy might be null
    if (!complaint.reportedBy) {
      return res.status(404).json({ message: 'Complaint reporter not found' });
    }
    const reporterId = complaint.reportedBy._id || complaint.reportedBy;
    if (reporterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this complaint' });
    }

    // Only allow deleting if status is Open
    if (complaint.status !== 'Open') {
      return res.status(400).json({ message: 'Cannot delete complaint that is not Open' });
    }

    await complaint.deleteOne();

    res.json({
      success: true,
      message: 'Complaint deleted successfully',
    });
  } catch (error) {
    console.error('Delete own complaint error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload evidence image for complaint
// @route   POST /api/complaints/:id/image
// @access  Guest, Staff
const uploadEvidenceImage = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Check authorization - handle case where reportedBy might be null
    if (!complaint.reportedBy) {
      return res.status(404).json({ message: 'Complaint reporter not found' });
    }
    const reporterId = complaint.reportedBy._id || complaint.reportedBy;
    if (
      req.user.role !== 'admin' &&
      reporterId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to upload images' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    // Save image path
    complaint.evidenceImage = req.file.path;
    await complaint.save();

    await complaint.populate('reportedBy', 'name email role');

    res.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Upload evidence image error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get complaint statistics
// @route   GET /api/complaints/stats
// @access  Admin
const getComplaintStats = async (req, res) => {
  try {
    // Get counts by status
    const byStatus = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get counts by priority
    const byPriority = await Complaint.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get counts by type
    const byType = await Complaint.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get total count
    const total = await Complaint.countDocuments();

    // Get open complaints count
    const openCount = await Complaint.countDocuments({ status: 'Open' });

    res.json({
      success: true,
      total,
      openCount,
      byStatus,
      byPriority,
      byType,
    });
  } catch (error) {
    console.error('Get complaint stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
