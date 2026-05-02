const Room = require('./roomModel');
const fs = require('fs');
const cloudinary = require('../../config/cloudinary');

const uploadRoomImage = async (file) => {
  if (!file) return '';

  const uploadResult = await cloudinary.uploader.upload(file.path, {
    folder: 'stayease/rooms',
    resource_type: 'image',
    use_filename: true,
    unique_filename: true,
  });

  return uploadResult.secure_url;
};

const removeLocalFile = (file) => {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlink(file.path, () => {});
  }
};

const cloudinaryReady = () => (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// POST /api/rooms — admin creates a room
const createRoom = async (req, res) => {
  try {
    const { roomNumber, roomType, pricePerNight, capacity, description, floor, availabilityStatus, amenities } = req.body;
    if (!roomNumber || !pricePerNight || !capacity)
      return res.status(400).json({ message: 'Room number, price and capacity are required' });

    if (!req.file)
      return res.status(400).json({ message: 'Room image is required' });

    if (!cloudinaryReady())
      return res.status(500).json({ message: 'Cloudinary is not configured on the server' });

    const thumbnailImage = await uploadRoomImage(req.file);

    const room = await Room.create({
      roomNumber, roomType, pricePerNight: Number(pricePerNight),
      capacity: Number(capacity), description, floor: Number(floor) || 1,
      availabilityStatus, amenities: Array.isArray(amenities) ? amenities : amenities ? [amenities] : [],
      thumbnailImage,
    });
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    removeLocalFile(req.file);
  }
};

// GET /api/rooms — get all rooms with optional query filters
const getAllRooms = async (req, res) => {
  try {
    const filter = {};
    if (req.query.type)      filter.roomType           = req.query.type;
    if (req.query.status)    filter.availabilityStatus = req.query.status;
    if (req.query.floor)     filter.floor              = Number(req.query.floor);
    if (req.query.maxPrice)  filter.pricePerNight      = { $lte: Number(req.query.maxPrice) };

    const rooms = await Room.find(filter).sort({ createdAt: -1 });
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rooms/:id — get single room
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/rooms/:id — admin updates room
const updateRoom = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) {
      if (!cloudinaryReady())
        return res.status(500).json({ message: 'Cloudinary is not configured on the server' });

      updates.thumbnailImage = await uploadRoomImage(req.file);
    }

    if (updates.amenities && !Array.isArray(updates.amenities))
      updates.amenities = [updates.amenities];

    const room = await Room.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  } finally {
    removeLocalFile(req.file);
  }
};

// DELETE /api/rooms/:id — admin deletes room
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rooms/available?checkIn=DATE&checkOut=DATE — rooms with no approved bookings in range
const getAvailableRooms = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut)
      return res.status(400).json({ message: 'checkIn and checkOut dates are required' });

    // Import Booking here to avoid circular dependency issues
    const Booking = require('../booking/bookingModel');

    // Find booking IDs that overlap with the requested dates
    const conflicting = await Booking.find({
      status: 'Approved',
      checkInDate:  { $lt: new Date(checkOut) },
      checkOutDate: { $gt: new Date(checkIn) },
    }).select('roomId');

    const bookedRoomIds = conflicting.map(b => b.roomId.toString());

    // Return rooms that are not in that list and not under maintenance
    const rooms = await Room.find({
      _id: { $nin: bookedRoomIds },
      availabilityStatus: { $ne: 'maintenance' },
    });
    res.status(200).json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom, getAvailableRooms };
