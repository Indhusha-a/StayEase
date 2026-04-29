const jwt = require('jsonwebtoken');
const User = require('../modules/auth/userModel');

// Simple in-process cache: token → user, expires after 5 min
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Check cache first — no DB round-trip on cached tokens
    const cached = cache.get(token);
    if (cached && Date.now() < cached.exp) {
      req.user = cached.user;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean(); // .lean() = plain JS obj, faster
    if (!user) return res.status(401).json({ message: 'User not found' });

    cache.set(token, { user, exp: Date.now() + CACHE_TTL });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: `Access denied. Required: ${roles.join(' or ')}` });
  }
  next();
};

module.exports = { protect, authorizeRoles };