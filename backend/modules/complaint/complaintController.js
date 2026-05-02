const mongoose = require('mongoose');
const Complaint = require('./complaintModel');
const Room = require('../room/roomModel');
const Staff = require('../staff/staffModel');

const validTypes = ['Complaint', 'Maintenance', 'Housekeeping'];
const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
const validStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const populateComplaint = (query) => query
  .populate('reportedBy', 'name email role phone')
  .populate('roomId', 'roomNumber roomType floor')
  .populate('assignedStaff', 'name role email phone department shift');

const createComplaint = async (req, res) => {
  try {
    const { roomId, type, title, description, priority } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ message: 'Type, title, and description are required' });
    }

    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid complaint type' });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority' });
    }

    if (roomId) {
      if (!isValidId(roomId)) {
        return res.status(400).json({ message: 'Invalid room id' });
      }

      const roomExists = await Room.exists({ _id: roomId });
      if (!roomExists) {
        return res.status(404).json({ message: 'Room not found' });
      }
    }

    const complaint = await Complaint.create({
      reportedBy: req.user._id || req.user.id,
      roomId: roomId || null,
      type,
      title,
      description,
      priority: priority || 'Low',
    });

    const createdComplaint = await populateComplaint(Complaint.findById(complaint._id));
    return res.status(201).json(createdComplaint);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      if (!validStatuses.includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status filter' });
      }
      filter.status = req.query.status;
    }

    if (req.query.priority) {
      if (!validPriorities.includes(req.query.priority)) {
        return res.status(400).json({ message: 'Invalid priority filter' });
      }
      filter.priority = req.query.priority;
    }

    const complaints = await populateComplaint(
      Complaint.find(filter).sort({ createdAt: -1 })
    );

    return res.status(200).json(complaints);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await populateComplaint(
      Complaint.find({ reportedBy: req.user._id || req.user.id }).sort({ createdAt: -1 })
    );

    return res.status(200).json(complaints);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAssignedComplaints = async (req, res) => {
  try {
    const staff = await Staff.findOne({
      email: req.user.email,
      isActive: true,
    });

    if (!staff) {
      return res.status(200).json([]);
    }

    const complaints = await populateComplaint(
      Complaint.find({ assignedStaff: staff._id }).sort({ createdAt: -1 })
    );

    return res.status(200).json(complaints);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getComplaintById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint id' });
    }

    const complaint = await populateComplaint(Complaint.findById(req.params.id));
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const ownerId = complaint.reportedBy?._id?.toString() || complaint.reportedBy?.toString();
    const userId = (req.user._id || req.user.id).toString();
    const staff = req.user.role === 'staff'
      ? await Staff.findOne({ email: req.user.email, isActive: true })
      : null;
    const assignedStaffId = complaint.assignedStaff?._id?.toString() || complaint.assignedStaff?.toString();
    const isAssignedStaff = staff && assignedStaffId === staff._id.toString();

    if (req.user.role !== 'admin' && ownerId !== userId && !isAssignedStaff) {
      return res.status(403).json({ message: 'Access denied. You can only view your own or assigned complaints' });
    }

    return res.status(200).json(complaint);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint id' });
    }

    const { status, assignedTo, assignedStaff } = req.body;

    if (!status && assignedTo === undefined && assignedStaff === undefined) {
      return res.status(400).json({ message: 'Status, assignedTo, or assignedStaff is required' });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    if (status) {
      complaint.status = status;
      complaint.resolvedAt = status === 'Resolved' ? Date.now() : null;
    }

    if (assignedStaff !== undefined) {
      if (!assignedStaff) {
        complaint.assignedStaff = null;
        complaint.assignedTo = assignedTo || '';
      } else {
        if (!isValidId(assignedStaff)) {
          return res.status(400).json({ message: 'Invalid staff id' });
        }

        const staff = await Staff.findOne({ _id: assignedStaff, isActive: true });
        if (!staff) {
          return res.status(404).json({ message: 'Assigned staff member not found' });
        }

        complaint.assignedStaff = staff._id;
        complaint.assignedTo = staff.name;
      }
    } else if (assignedTo !== undefined) {
      complaint.assignedTo = assignedTo;
    }

    await complaint.save();

    const updatedComplaint = await populateComplaint(Complaint.findById(complaint._id));
    return res.status(200).json(updatedComplaint);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteComplaint = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint id' });
    }

    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    return res.status(200).json({ message: 'Complaint deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadComplaintImage = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid complaint id' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const userId = (req.user._id || req.user.id).toString();
    if (complaint.reportedBy.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only upload images for your own complaints' });
    }

    complaint.evidenceImage = req.file.path;
    await complaint.save();

    const updatedComplaint = await populateComplaint(Complaint.findById(complaint._id));
    return res.status(200).json({
      message: 'Evidence image uploaded successfully',
      evidenceImage: complaint.evidenceImage,
      complaint: updatedComplaint,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createComplaint,
  getAllComplaints,
  getMyComplaints,
  getAssignedComplaints,
  getComplaintById,
  updateComplaintStatus,
  deleteComplaint,
  uploadComplaintImage,
};
