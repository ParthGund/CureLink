const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes — verify JWT and attach user to request.
 * Accepts token from either cookies or Authorization header.
 */
const protect = async (req, res, next) => {
  let token;

  // Check cookie exclusively for security
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Not authorized, token has expired.'
        : 'Not authorized, invalid token.';

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

/**
 * Restrict access to specific roles.
 * Must be used after the `protect` middleware.
 *
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'doctor').
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: insufficient permissions.',
      });
    }

    next();
  };
};

module.exports = { protect, authorize, authorizeRoles: authorize };
