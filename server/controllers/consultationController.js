const consultationService = require('../services/consultationService');
const { sendError } = require('../utils/httpError');
const {
  validateConsultationCreation,
  validateConsultationId,
  validateConsultationUpdate,
} = require('../validators/consultationValidator');

/**
 * POST /api/consultations
 * Start a new consultation for one of the doctor's own appointments.
 */
const createConsultation = async (req, res) => {
  try {
    const { valid, errors } = validateConsultationCreation(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const consultation = await consultationService.startConsultation(
      req.user,
      req.body.appointmentId
    );

    res.status(201).json({ success: true, consultation });
  } catch (error) {
    // Mongo duplicate-key on the unique appointment index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A consultation already exists for this appointment.',
      });
    }
    sendError(res, error, 'Failed to create consultation.');
  }
};

/**
 * GET /api/consultations/doctor/me
 * List consultations for the authenticated doctor.
 */
const getDoctorConsultations = async (req, res) => {
  try {
    const consultations = await consultationService.getDoctorConsultations(req.user);
    res.status(200).json({ success: true, consultations });
  } catch (error) {
    sendError(res, error, 'Failed to fetch consultations.');
  }
};

/**
 * GET /api/consultations/me
 * List completed consultations for the authenticated patient.
 */
const getPatientConsultations = async (req, res) => {
  try {
    const consultations = await consultationService.getPatientConsultations(req.user);
    res.status(200).json({ success: true, consultations });
  } catch (error) {
    sendError(res, error, 'Failed to fetch consultations.');
  }
};

/**
 * GET /api/consultations/:id
 * Get a single consultation by ID (doctor or patient, role-gated).
 */
const getConsultationById = async (req, res) => {
  try {
    const { valid, errors } = validateConsultationId(req.params.id);
    if (!valid) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const consultation = await consultationService.getConsultationById(
      req.params.id,
      req.user
    );

    res.status(200).json({ success: true, consultation });
  } catch (error) {
    sendError(res, error, 'Failed to fetch consultation.');
  }
};

/**
 * PUT /api/consultations/:id
 * Update an in-progress consultation (doctor only).
 */
const updateConsultation = async (req, res) => {
  try {
    const { valid: idValid, errors: idErrors } = validateConsultationId(req.params.id);
    if (!idValid) {
      return res.status(400).json({ success: false, message: idErrors[0] });
    }

    const { valid, errors } = validateConsultationUpdate(req.body);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const consultation = await consultationService.updateConsultation(
      req.params.id,
      req.user,
      req.body
    );

    res.status(200).json({ success: true, consultation });
  } catch (error) {
    sendError(res, error, 'Failed to update consultation.');
  }
};

/**
 * PUT /api/consultations/:id/complete
 * Mark a consultation as completed (doctor only).
 */
const completeConsultation = async (req, res) => {
  try {
    const { valid, errors } = validateConsultationId(req.params.id);
    if (!valid) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const consultation = await consultationService.completeConsultation(
      req.params.id,
      req.user
    );

    res.status(200).json({ success: true, consultation });
  } catch (error) {
    sendError(res, error, 'Failed to complete consultation.');
  }
};

module.exports = {
  createConsultation,
  getDoctorConsultations,
  getPatientConsultations,
  getConsultationById,
  updateConsultation,
  completeConsultation,
};
