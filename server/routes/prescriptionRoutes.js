const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  upsertPrescription,
  getPrescriptionByConsultation,
  getDoctorPrescriptions,
  getPatientPrescriptions,
  getPatientActiveMedicines,
} = require('../controllers/prescriptionController');

// All prescription routes require authentication
router.use(protect);

// Static paths before parameterised ones to avoid capture
router.get('/doctor/me', authorize('doctor'), getDoctorPrescriptions);
router.get('/me/active', authorize('patient'), getPatientActiveMedicines);
router.get('/me', authorize('patient'), getPatientPrescriptions);

// Parameterised consultation routes
router.put(
  '/consultation/:consultationId',
  authorize('doctor'),
  upsertPrescription
);
router.get(
  '/consultation/:consultationId',
  authorize('doctor', 'patient'),
  getPrescriptionByConsultation
);

module.exports = router;
