const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  getPlatformStats,
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllPatients,
  deletePatient,
  getAllAppointments,
  updateAppointmentStatus,
} = require('../controllers/adminController');

// Every admin route requires authentication + admin role
router.use(protect, authorize('admin'));

// Platform stats
router.get('/stats', getPlatformStats);

// Doctor management
router.get('/doctors', getAllDoctors);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.delete('/doctors/:id', deleteDoctor);

// Patient management
router.get('/patients', getAllPatients);
router.delete('/patients/:id', deletePatient);

// Appointment management
router.get('/appointments', getAllAppointments);
router.put('/appointments/:id/status', updateAppointmentStatus);

module.exports = router;
