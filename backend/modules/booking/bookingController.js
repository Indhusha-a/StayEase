const Booking = require('./bookingModel');
const Room = require('../room/roomModel');

/**
 * CREATE a new booking (Guest only)
 * POST /api/bookings
 */
exports.createBooking = async (req, res) => {
  try {
    const { roomId, checkInDate, checkOutDate, numberOfGuests, specialRequests } = req.body;

    // Validate required fields
    if (!roomId || !checkInDate || !checkOutDate || numberOfGuests === null || numberOfGuests === undefined) {
      return res.status(400).json({ 
        message: 'Missing required fields: roomId, checkInDate, checkOutDate, numberOfGuests' 
      });
    }

    // Validate numberOfGuests is a positive number
    if (numberOfGuests <= 0 || isNaN(numberOfGuests)) {
      return res.status(400).json({ 
        message: 'Invalid Number of Guests - must be greater than 0' 
      });
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.status(400).json({ 
        message: 'Invalid date format' 
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ 
        message: 'Check-out date must be after check-in date' 
      });
    }

    // Get the room to calculate total price
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ 
        message: 'Room not found' 
      });
    }

    // Calculate total price: (nights × pricePerNight)
    const numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = numberOfNights * room.pricePerNight;

    // Create booking with Pending status
    const booking = new Booking({
      userId: req.user._id,
      roomId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      totalPrice,
      specialRequests: specialRequests || ''
    });

    await booking.save();

    // ✅ UPDATE ROOM AVAILABILITY
    const bookedDates = room.bookedDates || [];
    bookedDates.push({
      checkIn: new Date(checkInDate),
      checkOut: new Date(checkOutDate),
      bookingId: booking._id
    });
    
    room.bookedDates = bookedDates;
    
    // Mark room as booked if it has overlapping bookings
    const allBookings = await Booking.find({ 
      roomId: roomId,
      status: { $in: ['Pending', 'Approved'] }
    });
    
    if (allBookings.length > 0) {
      room.availabilityStatus = 'booked';
    }
    
    await room.save();

    await booking.populate('roomId', 'roomNumber roomType pricePerNight capacity');
    
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      message: 'Server error while creating booking',
      error: error.message 
    });
  }
};

/**
 * GET all bookings (Admin only)
 * GET /api/bookings
 */
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('userId', 'name email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ 
      message: 'Server error while fetching bookings',
      error: error.message 
    });
  }
};

/**
 * GET own bookings (Guest only)
 * GET /api/bookings/my
 */
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('roomId', 'roomNumber roomType pricePerNight')
      .sort({ bookingDate: -1 });

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({ 
        success: true,
        message: 'No bookings found', 
        bookings: [] 
      });
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    console.error('Error fetching my bookings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching bookings',
      error: error.message 
    });
  }
};

/**
 * GET single booking by ID (Protected)
 * GET /api/bookings/:id
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('roomId', 'roomNumber roomType pricePerNight capacity');

    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found' 
      });
    }

    res.status(200).json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    res.status(500).json({ 
      message: 'Server error while fetching booking',
      error: error.message 
    });
  }
};

/**
 * UPDATE booking status (Admin only - Approve or Reject)
 * PUT /api/bookings/:id/status
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Validate status value
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be "Approved" or "Rejected"' 
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found' 
      });
    }

    booking.status = status;
    booking.updatedAt = Date.now();

    // If approved, increase room occupancy
    if (status === 'Approved') {
      const room = await Room.findById(booking.roomId);
      if (!room) {
        return res.status(404).json({ 
          message: 'Associated room not found' 
        });
      }

      // Increase occupancy
      room.currentOccupancy = (room.currentOccupancy || 0) + booking.numberOfGuests;

      // Auto-set availabilityStatus to 'booked' if at capacity
      if (room.currentOccupancy >= room.capacity) {
        room.availabilityStatus = 'booked';
      }

      await room.save();
    }

    await booking.save();
    
    res.status(200).json({
      success: true,
      message: `Booking ${status.toLowerCase()} successfully`,
      booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      message: 'Server error while updating booking status',
      error: error.message 
    });
  }
};

/**
 * CANCEL booking (Guest only - own booking, Pending status only)
 * PUT /api/bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ 
        message: 'Booking not found' 
      });
    }

    // Verify ownership - guest can only cancel own bookings
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ 
        message: 'You can only cancel your own bookings' 
      });
    }

    // Can only cancel Pending bookings
    if (booking.status !== 'Pending') {
      return res.status(400).json({ 
        message: `Cannot cancel ${booking.status} bookings. Only Pending bookings can be cancelled.` 
      });
    }

    booking.status = 'Cancelled';
    booking.updatedAt = Date.now();
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ 
      message: 'Server error while cancelling booking',
      error: error.message 
    });
  }
};