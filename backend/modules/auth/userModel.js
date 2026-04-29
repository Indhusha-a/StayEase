const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['guest', 'staff', 'admin'], default: 'guest' },
  phone:    { type: String, default: '' },
}, { timestamps: true });

// Compound index for login query pattern
userSchema.index({ email: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);