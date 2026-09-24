const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getMyAppointments,
  getPatientAppointments,
  getAppointmentById,
  cancelAppointment,
} = require('../controllers/appointmentController');

// All appointment routes require authentication
router.use(protect);

router.post('/', createAppointment);
router.get('/me', getMyAppointments);
router.get('/patient/:patientId', getPatientAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id/cancel', cancelAppointment);

module.exports = router;