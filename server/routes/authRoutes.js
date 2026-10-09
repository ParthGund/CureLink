const express = require('express');
const {
  registerPatient,
  loginPatient,
  logoutUser,
  getMe,
  updateMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
});

const router = express.Router();

router.post('/register', authLimiter, registerPatient);
router.post('/login', authLimiter, loginPatient);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

module.exports = router;

