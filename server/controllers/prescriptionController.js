const prescriptionService = require('../services/prescriptionService');
const { sendError } = require('../utils/httpError');
const {
  validateConsultationIdParam,
  validatePrescriptionUpsert,
} = require('../validators/prescriptionValidator');

/**
 * PUT /api/prescriptions/consultation/:consultationId
 * Create or replace prescription items for a consultation.
 */
const upsertPrescription = async (req, res) => {
  try {
    const { valid: idValid, errors: idErrors } = validateConsultationIdParam(
      req.params.consultationId
    );
    if (!idValid) {
      return res.status(400).json({ success: false, message: idErrors[0], errors: idErrors });
    }

    const { valid, errors } = validatePrescriptionUpsert(req.body);
    if (!valid) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const { prescription } = await prescriptionService.upsertPrescription(
      req.user,
      req.params.consultationId,
      req.body.items
    );

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    sendError(res, error, 'Failed to save prescription.');
  }
};

/**
 * GET /api/prescriptions/consultation/:consultationId
 * Get the prescription for a consultation (doctor or patient, role-gated).
 */
const getPrescriptionByConsultation = async (req, res) => {
  try {
    const { valid, errors } = validateConsultationIdParam(
      req.params.consultationId
    );
    if (!valid) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const { prescription } = await prescriptionService.getPrescriptionByConsultation(
      req.user,
      req.params.consultationId
    );

    res.status(200).json({ success: true, prescription });
  } catch (error) {
    sendError(res, error, 'Failed to fetch prescription.');
  }
};

/**
 * GET /api/prescriptions/doctor/me
 * List prescriptions issued by the authenticated doctor.
 */
const getDoctorPrescriptions = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getDoctorPrescriptions(req.user);
    res.status(200).json({ success: true, prescriptions });
  } catch (error) {
    sendError(res, error, 'Failed to fetch prescriptions.');
  }
};

/**
 * GET /api/prescriptions/me
 * List prescriptions for the authenticated patient (completed consultations only).
 */
const getPatientPrescriptions = async (req, res) => {
  try {
    const prescriptions = await prescriptionService.getPatientPrescriptions(req.user);
    res.status(200).json({ success: true, prescriptions });
  } catch (error) {
    sendError(res, error, 'Failed to fetch prescriptions.');
  }
};

/**
 * GET /api/prescriptions/me/active
 * List currently active medicines for the authenticated patient.
 */
const getPatientActiveMedicines = async (req, res) => {
  try {
    const medicines = await prescriptionService.getPatientActiveMedicines(req.user);
    res.status(200).json({ success: true, medicines });
  } catch (error) {
    sendError(res, error, 'Failed to fetch active medicines.');
  }
};

module.exports = {
  upsertPrescription,
  getPrescriptionByConsultation,
  getDoctorPrescriptions,
  getPatientPrescriptions,
  getPatientActiveMedicines,
};
