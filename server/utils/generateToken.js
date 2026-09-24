const jwt = require('jsonwebtoken');
const { JWT_EXPIRE, COOKIE_MAX_AGE_MS } = require('../config/auth');

/**
 * Generate a JWT for the given user and set it as an HTTP-only cookie.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {string} userId - The user's MongoDB _id.
 * @param {string} role - The user's role (patient, doctor, admin).
 */
const generateToken = (res, userId, role) => {
  const token = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRE }
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE_MS,
  });
};

module.exports = generateToken;
