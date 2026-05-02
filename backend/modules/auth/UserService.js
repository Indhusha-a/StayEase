const User = require('./userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });

const passwordRules = [
  { test: (v) => v.length >= 6, message: 'Password must be at least 6 characters' },
];

const validatePassword = (password = '') => {
  for (const rule of passwordRules) {
    if (!rule.test(password)) {
      return rule.message;
    }
  }
  return null;
};

const validateEmail = (email = '') => /^\S+@\S+\.\S+$/.test(email);

const checkEmailAvailability = async (email) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return { available: false, message: 'Email is required' };
  }

  if (!validateEmail(normalizedEmail)) {
    return { available: false, message: 'Invalid email format' };
  }

  const exists = await User.exists({ email: normalizedEmail });
  return { available: !exists };
};

const asTrimmedString = (value) => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const registerUser = async (payload = {}) => {
  const {
    name,
    fullName,
    email,
    password,
    role,
    phone
  } = payload;

  const trimmedName = asTrimmedString(name) || asTrimmedString(fullName);
  const normalizedEmail = asTrimmedString(email).toLowerCase();
  const cleanedPhone = asTrimmedString(phone);
  const normalizedPassword = typeof password === 'string' ? password : '';

  if (!trimmedName || !normalizedEmail || !normalizedPassword) {
    const error = new Error('Name, email and password are required');
    error.status = 400;
    throw error;
  }

  if (!validateEmail(normalizedEmail)) {
    const error = new Error('Invalid email format');
    error.status = 400;
    throw error;
  }

  const passwordError = validatePassword(normalizedPassword);
  if (passwordError) {
    const error = new Error(passwordError);
    error.status = 400;
    throw error;
  }

  const exists = await User.exists({ email: normalizedEmail });
  if (exists) {
    const error = new Error('User already exists with this email');
    error.status = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(normalizedPassword, 10);

  const user = await User.create({
    name: trimmedName,
    email: normalizedEmail,
    password: hashedPassword,
    role: role || 'guest',
    phone: cleanedPhone,
  });

  return {
    token: generateToken(user._id, user.role),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const loginUser = async ({ email, password }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail || !password) {
    const error = new Error('Email and password are required');
    error.status = 400;
    throw error;
  }

  if (!validateEmail(normalizedEmail)) {
    const error = new Error('Invalid email format');
    error.status = 400;
    throw error;
  }

  const user = await User.findOne({ email: normalizedEmail }).select('+password').lean();
  if (!user) {
    const error = new Error('No account found for this email');
    error.status = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Incorrect password');
    error.status = 401;
    throw error;
  }

  return {
    token: generateToken(user._id, user.role),
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

module.exports = {
  validatePassword,
  checkEmailAvailability,
  registerUser,
  loginUser,
};
