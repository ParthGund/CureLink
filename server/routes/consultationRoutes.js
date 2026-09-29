const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createConsultation,
  getDoctorConsultations,
  getPatientConsultations,
  getConsultationById,
  updateConsultation,
  completeConsultation,
} = require('../controllers/consultationController');

// All consultation routes require authentication
router.use(protect);

// Static paths before :id to avoid param capture
router.get('/doctor/me', authorize('doctor'), getDoctorConsultations);
router.get('/me', authorize('patient'), getPatientConsultations);

router.post('/', authorize('doctor'), createConsultation);
router.get('/:id', authorize('doctor', 'patient'), getConsultationById);
router.put('/:id', authorize('doctor'), updateConsultation);
router.put('/:id/complete', authorize('doctor'), completeConsultation);

module.exports = router;
