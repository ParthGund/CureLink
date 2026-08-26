const jwt = require('jsonwebtoken');

/**
 * Generate a JWT for the given user and set it as an HTTP-only cookie.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {string} userId - The user's MongoDB _id.
 * @param {string} role - The user's role (patient, doctor, admin).
 * @returns {string} The signed JWT string.
 */
const generateToken = (res, userId, role) => {
  const token = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return token;
};

module.exports = generateToken;
