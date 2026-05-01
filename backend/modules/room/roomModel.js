const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber:         { type: String, required: true, unique: true, trim: true },
  roomType:           { type: String, enum: ['Single','Double','Suite','Deluxe'], required: true },
  pricePerNight:      { type: Number, required: true },
  capacity:           { type: Number, required: true },
  currentOccupancy:   { type: Number, default: 0 },
  description:        { type: String, default: '' },
  amenities:          { type: [String], default: [] },
  thumbnailImage:     { type: String, default: '' },
  bookedDates: [{
    checkIn: Date,
    checkOut: Date,
    bookingId:        {type: mongoose.Schema.Types.ObjectId, ref: 'Booking'}
  }],
  createdAt: {type: Date, default: Date.now},
  updatedAt: {type: Date, default: Date.now},
  availabilityStatus: { type: String, enum: ['available','booked','maintenance'], default: 'available' },
  floor:              { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);