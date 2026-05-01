const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  // Unique identifier displayed to guests (e.g. '101', '202A')
  roomNumber:         { type: String, required: true, unique: true, trim: true },

  // Determines pricing tier and available amenities
  roomType:           { type: String, enum: ['Single', 'Double', 'Suite', 'Deluxe'], required: true },

  pricePerNight:      { type: Number, required: true },

  // Maximum number of guests allowed in this room
  capacity:           { type: Number, required: true },

  // Tracks how many guests are currently checked in — should never exceed capacity
  currentOccupancy:   { type: Number, default: 0 },

  description:        { type: String, default: '' },

  // e.g. ['WiFi', 'Air Conditioning', 'Mini Bar']
  amenities:          { type: [String], default: [] },

  // Cloudinary URL or local path set by the upload middleware on create/update
  thumbnailImage:     { type: String, default: '' },

  // Controls whether the room appears in availability searches
  availabilityStatus: { type: String, enum: ['available', 'booked', 'maintenance'], default: 'available' },

  floor:              { type: Number, default: 1 },

}, { timestamps: true }); // createdAt and updatedAt managed automatically

module.exports = mongoose.model('Room', roomSchema);

