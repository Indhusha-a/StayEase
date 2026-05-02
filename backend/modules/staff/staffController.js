const mongoose = require('mongoose');
const Staff = require('./staffModel');

const validRoles = ['Receptionist', 'Housekeeper', 'Manager', 'Security', 'Chef'];
const validShifts = ['Morning', 'Evening', 'Night'];

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const isOwnStaffRecord = (req, staff) => {
  const userId = req.user?._id || req.user?.id;
  const sameId = userId && staff._id.toString() === userId.toString();
  const sameEmail = req.user?.email && staff.email === req.user.email;
  return sameId || sameEmail;
};

const addStaff = async (req, res) => {
  try {
    const { name, role, email, phone, salary, shift, department, joiningDate } = req.body;

    if (!name || !role || !email || !phone) {
      return res.status(400).json({ message: 'Name, role, email, and phone are required' });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid staff role' });
    }

    if (shift && !validShifts.includes(shift)) {
      return res.status(400).json({ message: 'Invalid staff shift' });
    }

    const existingStaff = await Staff.findOne({ email: email.toLowerCase().trim() });
    if (existingStaff) {
      return res.status(400).json({ message: 'A staff member with this email already exists' });
    }

    const staff = await Staff.create({
      name,
      role,
      email,
      phone,
      salary: salary === undefined || salary === '' ? 0 : Number(salary),
      shift: shift || 'Morning',
      department: department || '',
      joiningDate: joiningDate || Date.now(),
    });

    return res.status(201).json(staff);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A staff member with this email already exists' });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllStaff = async (req, res) => {
  try {
    const filter = { isActive: true };

    if (req.query.role) {
      if (!validRoles.includes(req.query.role)) {
        return res.status(400).json({ message: 'Invalid staff role filter' });
      }
      filter.role = req.query.role;
    }

    if (req.query.shift) {
      if (!validShifts.includes(req.query.shift)) {
        return res.status(400).json({ message: 'Invalid staff shift filter' });
      }
      filter.shift = req.query.shift;
    }

    const staff = await Staff.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(staff);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getStaffById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    let staff = await Staff.findById(req.params.id);
    if (!staff && req.user.role === 'staff' && req.user.email) {
      staff = await Staff.findOne({ email: req.user.email.toLowerCase(), isActive: true });
    }

    if (!staff || !staff.isActive) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    if (req.user.role !== 'admin' && !isOwnStaffRecord(req, staff)) {
      return res.status(403).json({ message: 'Access denied. You can only view your own staff profile' });
    }

    return res.status(200).json(staff);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff || !staff.isActive) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const { name, role, email, phone, salary, shift, department, joiningDate } = req.body;

    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid staff role' });
    }

    if (shift && !validShifts.includes(shift)) {
      return res.status(400).json({ message: 'Invalid staff shift' });
    }

    if (email) {
      const existingStaff = await Staff.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: staff._id },
      });
      if (existingStaff) {
        return res.status(400).json({ message: 'A staff member with this email already exists' });
      }
      staff.email = email;
    }

    if (name !== undefined) staff.name = name;
    if (role !== undefined) staff.role = role;
    if (phone !== undefined) staff.phone = phone;
    if (salary !== undefined) staff.salary = salary === '' ? 0 : Number(salary);
    if (shift !== undefined) staff.shift = shift;
    if (department !== undefined) staff.department = department;
    if (joiningDate !== undefined) staff.joiningDate = joiningDate;

    const updatedStaff = await staff.save();
    return res.status(200).json(updatedStaff);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A staff member with this email already exists' });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff || !staff.isActive) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    staff.isActive = false;
    await staff.save();

    return res.status(200).json({ message: 'Staff member deactivated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const uploadStaffPhoto = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid staff id' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const staff = await Staff.findById(req.params.id);
    if (!staff || !staff.isActive) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    staff.profileImage = req.file.path;
    await staff.save();

    return res.status(200).json({
      message: 'Profile photo uploaded successfully',
      profileImage: staff.profileImage,
      staff,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  uploadStaffPhoto,
};
