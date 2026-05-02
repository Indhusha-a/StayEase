const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
    },
    type: {
      type: String,
      enum: ['Complaint', 'Maintenance', 'Housekeeping'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidenceImage: {
      type: String,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Low',
    },
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
    assignedTo: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;