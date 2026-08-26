const express = require('express');
const {
  registerPatient,
  loginPatient,
  logoutUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerPatient);
router.post('/login', loginPatient);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

module.exports = router;

