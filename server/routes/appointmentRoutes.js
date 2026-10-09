const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createAppointment,
  getMyAppointments,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  cancelAppointment,
} = require('../controllers/appointmentController');

// All appointment routes require authentication
router.use(protect);

router.post('/', authorize('patient'), createAppointment);
router.get('/me', getMyAppointments);
router.get('/doctor/me', authorize('doctor'), getDoctorAppointments);
router.get('/patient/:patientId', getPatientAppointments);
router.get('/:id', getAppointmentById);
router.put('/:id/cancel', cancelAppointment);

module.exports = router;