const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['Receptionist', 'Housekeeper', 'Manager', 'Security', 'Chef'],
      required: true,
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    salary: { type: Number, default: 0 },
    shift: { type: String, enum: ['Morning', 'Evening', 'Night'], default: 'Morning' },
    profileImage: { type: String, default: '' },
    department: { type: String, default: '', trim: true },
    joiningDate: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);
