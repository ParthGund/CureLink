const mongoose = require('mongoose');
const Consultation = require('../models/Consultation');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const appointmentService = require('./appointmentService');
const doctorService = require('./doctorService');
const { httpError } = require('../utils/httpError');

/**
 * Start a new consultation for a doctor's own appointment.
 *
 * Copies patient and doctor from the appointment — never from the request.
 * Rejects cancelled appointments and appointments that already have a consultation.
 *
 * @param {object} user - req.user (authenticated User document).
 * @param {string} appointmentId - Appointment._id.
 * @returns {Promise<object>} Created consultation document.
 */
async function startConsultation(user, appointmentId) {
  const doctor = await doctorService.getDoctorForUser(user._id);

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw httpError(404, 'Appointment not found.');
  }

  // Ownership: the appointment must belong to this doctor
  if (!appointment.doctor.equals(doctor._id)) {
    throw httpError(403, 'You can only start consultations for your own appointments.');
  }

  // Guard: cancelled appointments cannot have consultations
  if (appointment.status === 'cancelled') {
    throw httpError(400, 'Cannot start a consultation for a cancelled appointment.');
  }

  // Guard: completed appointments cannot have new consultations
  if (appointment.status === 'completed') {
    throw httpError(400, 'Cannot start a consultation for a completed appointment.');
  }

  // Guard: deleted patient or doctor on the appointment
  if (!appointment.patient) {
    throw httpError(404, 'The patient linked to this appointment no longer exists.');
  }

  const consultation = await Consultation.create({
    appointment: appointment._id,
    patient: appointment.patient,
    doctor: doctor._id,
  });

  return consultation;
}

/**
 * List consultations for the authenticated doctor, newest first.
 *
 * Populates patient name for the listing view.
 *
 * @param {object} user - req.user (authenticated User document).
 * @returns {Promise<object[]>} Array of consultation documents.
 */
async function getDoctorConsultations(user) {
  const doctor = await doctorService.getDoctorForUser(user._id);

  return Consultation.find({ doctor: doctor._id })
    .populate('patient', 'fullName')
    .populate('appointment', 'date timeSlot status')
    .sort({ createdAt: -1 });
}

/**
 * List completed consultations for the authenticated patient, newest first.
 *
 * Only completed consultations are visible to patients.
 * clinicalNotes is stripped from results.
 *
 * @param {object} user - req.user (authenticated User document).
 * @returns {Promise<object[]>} Array of consultation documents.
 */
async function getPatientConsultations(user) {
  const patient = await appointmentService.getPatientForUser(user._id);

  if (!patient) {
    return [];
  }

  return Consultation.find({ patient: patient._id, status: 'completed' })
    .select('-clinicalNotes')
    .populate('doctor', 'name specialization')
    .populate('appointment', 'date timeSlot')
    .sort({ completedAt: -1 });
}

/**
 * Get a single consultation by ID with role-based access.
 *
 * - Doctor: must own the consultation. Returns full record.
 * - Patient: must own the consultation AND it must be completed.
 *   clinicalNotes is stripped.
 * - Anyone else: 403.
 *
 * @param {string} consultationId - Consultation._id.
 * @param {object} user - req.user (authenticated User document).
 * @returns {Promise<object>} Consultation document.
 */
async function getConsultationById(consultationId, user) {
  const consultation = await Consultation.findById(consultationId)
    .populate('patient', 'fullName email phone')
    .populate('doctor', 'name specialization')
    .populate('appointment', 'date timeSlot status reason');

  if (!consultation) {
    throw httpError(404, 'Consultation not found.');
  }

  if (user.role === 'doctor') {
    const doctor = await doctorService.getDoctorForUser(user._id);

    if (!consultation.doctor._id.equals(doctor._id)) {
      throw httpError(403, 'You do not have access to this consultation.');
    }

    return consultation;
  }

  if (user.role === 'patient') {
    const patient = await appointmentService.getPatientForUser(user._id);

    if (!patient || !consultation.patient._id.equals(patient._id)) {
      throw httpError(403, 'You do not have access to this consultation.');
    }

    if (consultation.status !== 'completed') {
      throw httpError(403, 'You do not have access to this consultation.');
    }

    // Strip clinicalNotes for patient view
    const obj = consultation.toObject();
    delete obj.clinicalNotes;
    return obj;
  }

  // Admins and any other role get no access to consultation content
  throw httpError(403, 'You do not have access to this consultation.');
}

/**
 * Update editable fields of a doctor's own in-progress consultation.
 *
 * Whitelisted fields: chiefComplaint, diagnosis, clinicalNotes.
 * All other fields in the request body are ignored (no mass assignment).
 *
 * @param {string} consultationId - Consultation._id.
 * @param {object} user - req.user (authenticated User document).
 * @param {object} input - Request body with fields to update.
 * @returns {Promise<object>} Updated consultation document.
 */
async function updateConsultation(consultationId, user, input) {
  const doctor = await doctorService.getDoctorForUser(user._id);

  const consultation = await Consultation.findById(consultationId);

  if (!consultation) {
    throw httpError(404, 'Consultation not found.');
  }

  if (!consultation.doctor.equals(doctor._id)) {
    throw httpError(403, 'You can only update your own consultations.');
  }

  if (consultation.status === 'completed') {
    throw httpError(400, 'A completed consultation cannot be edited.');
  }

  // Whitelist editable fields
  if (input.chiefComplaint !== undefined) {
    consultation.chiefComplaint = input.chiefComplaint;
  }
  if (input.diagnosis !== undefined) {
    consultation.diagnosis = input.diagnosis;
  }
  if (input.clinicalNotes !== undefined) {
    consultation.clinicalNotes = input.clinicalNotes;
  }
  if (input.treatmentPlan !== undefined) {
    consultation.treatmentPlan = input.treatmentPlan;
  }
  if (input.followUpDate !== undefined) {
    consultation.followUpDate = input.followUpDate || null;
  }
  if (input.followUpInstructions !== undefined) {
    consultation.followUpInstructions = input.followUpInstructions;
  }

  await consultation.save();

  return consultation;
}

/**
 * Complete a consultation and mark the linked appointment as completed.
 *
 * Requires a non-empty diagnosis. Sets status to "completed" and
 * records completedAt timestamp.
 *
 * @param {string} consultationId - Consultation._id.
 * @param {object} user - req.user (authenticated User document).
 * @returns {Promise<object>} Updated consultation document.
 */
async function completeConsultation(consultationId, user) {
  const doctor = await doctorService.getDoctorForUser(user._id);

  const consultation = await Consultation.findById(consultationId);

  if (!consultation) {
    throw httpError(404, 'Consultation not found.');
  }

  if (!consultation.doctor.equals(doctor._id)) {
    throw httpError(403, 'You can only complete your own consultations.');
  }

  if (consultation.status === 'completed') {
    throw httpError(400, 'This consultation is already completed.');
  }

  if (!consultation.diagnosis || consultation.diagnosis.trim().length === 0) {
    throw httpError(400, 'A diagnosis is required before completing the consultation.');
  }

  // Find the prescription (if any) for this consultation
  const prescription = await Prescription.findOne({ consultation: consultationId });

  // Use atomic findOneAndUpdate to prevent race conditions
  const updateData = {
    $set: {
      status: 'completed',
      completedAt: new Date(),
    }
  };
  if (prescription) {
    updateData.$set.prescription = prescription._id;
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const updatedConsultation = await Consultation.findOneAndUpdate(
      { _id: consultationId, status: { $ne: 'completed' } },
      updateData,
      { new: true, session }
    );

    if (!updatedConsultation) {
      throw httpError(400, 'Consultation is already completed or modified concurrently.');
    }

    await Appointment.findByIdAndUpdate(
      consultation.appointment,
      { status: 'completed' },
      { session }
    );

    await session.commitTransaction();
    return updatedConsultation;
  } catch (err) {
    await session.abortTransaction();
    
    // Fallback for standalone MongoDB (no replica set)
    if (err.message && err.message.toLowerCase().includes('replica set')) {
      const updatedConsultation = await Consultation.findOneAndUpdate(
        { _id: consultationId, status: { $ne: 'completed' } },
        updateData,
        { new: true }
      );

      if (!updatedConsultation) {
        throw httpError(400, 'Consultation is already completed or modified concurrently.');
      }

      await Appointment.findByIdAndUpdate(
        consultation.appointment,
        { status: 'completed' }
      );
      return updatedConsultation;
    } else {
      throw err;
    }
  } finally {
    session.endSession();
  }

  return consultation;
}

module.exports = {
  startConsultation,
  getDoctorConsultations,
  getPatientConsultations,
  getConsultationById,
  updateConsultation,
  completeConsultation,
};
