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
  if (!doctor) {
    throw httpError(404, 'Your doctor profile has not been set up yet. Please contact an administrator.');
  }

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw httpError(404, 'Appointment not found.');
  }

  // Ownership: the appointment must belong to this doctor
  if (!appointment.doctor.equals(doctor._id)) {
    throw httpError(403, 'You can only start consultations for your own appointments.');
  }

  // Only active appointment states are eligible; terminal states cannot be reopened.
  if (!['scheduled', 'upcoming', 'confirmed'].includes(appointment.status)) {
    throw httpError(400, `Cannot start a consultation for an appointment that is ${appointment.status}.`);
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

    if (!doctor || !consultation.doctor || !consultation.doctor._id.equals(doctor._id)) {
      throw httpError(403, 'You do not have access to this consultation.');
    }

    return consultation;
  }

  if (user.role === 'patient') {
    const patient = await appointmentService.getPatientForUser(user._id);

    if (!patient || !consultation.patient || !consultation.patient._id.equals(patient._id)) {
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
  if (!doctor) {
    throw httpError(404, 'Your doctor profile has not been set up yet. Please contact an administrator.');
  }
  // Whitelist editable fields
  const updates = {};
  if (input.chiefComplaint !== undefined) {
    updates.chiefComplaint = input.chiefComplaint;
  }
  if (input.diagnosis !== undefined) {
    updates.diagnosis = input.diagnosis;
  }
  if (input.clinicalNotes !== undefined) {
    updates.clinicalNotes = input.clinicalNotes;
  }
  if (input.treatmentPlan !== undefined) {
    updates.treatmentPlan = input.treatmentPlan;
  }
  if (input.followUpDate !== undefined) {
    updates.followUpDate = input.followUpDate || null;
  }
  if (input.followUpInstructions !== undefined) {
    updates.followUpInstructions = input.followUpInstructions;
  }

  const consultation = await Consultation.findOneAndUpdate(
    { _id: consultationId, doctor: doctor._id, status: 'in_progress' },
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (consultation) return consultation;

  const existing = await Consultation.findById(consultationId).select('doctor status');
  if (!existing) throw httpError(404, 'Consultation not found.');
  if (!existing.doctor.equals(doctor._id)) {
    throw httpError(403, 'You can only update your own consultations.');
  }
  throw httpError(400, existing.status === 'completed'
    ? 'A completed consultation cannot be edited.'
    : 'This consultation is no longer available for editing.');

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
  if (!doctor) {
    throw httpError(404, 'Your doctor profile has not been set up yet. Please contact an administrator.');
  }

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

  const updateData = {
    $set: {
      status: 'completed',
      completedAt: new Date(),
    }
  };

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Read the prescription in the same snapshot as the finalization writes.
    const prescription = await Prescription.findOne({ consultation: consultationId }).session(session);
    if (prescription) {
      updateData.$set.prescription = prescription._id;
    }

    const updatedConsultation = await Consultation.findOneAndUpdate(
      { _id: consultationId, status: 'in_progress', diagnosis: /\S/ },
      updateData,
      { new: true, session }
    );

    if (!updatedConsultation) {
      throw httpError(400, 'Consultation is already completed or modified concurrently.');
    }

    const updatedAppointment = await Appointment.findOneAndUpdate(
      {
        _id: consultation.appointment,
        status: { $in: ['scheduled', 'upcoming', 'confirmed'] },
      },
      { status: 'completed' },
      { session, new: true }
    );

    if (!updatedAppointment) {
      throw httpError(400, 'The appointment is no longer active and cannot be completed.');
    }

    await session.commitTransaction();
    return updatedConsultation;
  } catch (err) {
    // A failed start/commit may leave no active transaction to abort. Preserve
    // the original error so replica-set fallback detection still works.
    if (session.inTransaction()) {
      await session.abortTransaction().catch(() => {});
    }

    // Fallback for standalone MongoDB (no replica set)
    if (err.message && err.message.toLowerCase().includes('replica set')) {
      const fallbackPrescription = await Prescription.findOne({ consultation: consultationId });
      const fallbackUpdateData = {
        $set: { ...updateData.$set },
      };
      if (fallbackPrescription) {
        fallbackUpdateData.$set.prescription = fallbackPrescription._id;
      }
      const updatedConsultation = await Consultation.findOneAndUpdate(
        { _id: consultationId, status: 'in_progress', diagnosis: /\S/ },
        fallbackUpdateData,
        { new: true }
      );

      if (!updatedConsultation) {
        throw httpError(400, 'Consultation is already completed or modified concurrently.');
      }

      const updatedAppointment = await Appointment.findOneAndUpdate(
        {
          _id: consultation.appointment,
          status: { $in: ['scheduled', 'upcoming', 'confirmed'] },
        },
        { status: 'completed' },
        { new: true }
      );
      if (!updatedAppointment) {
        throw httpError(400, 'The appointment is no longer active and cannot be completed.');
      }
      return updatedConsultation;
    } else {
      throw err;
    }
  } finally {
    await session.endSession();
  }
}

module.exports = {
  startConsultation,
  getDoctorConsultations,
  getPatientConsultations,
  getConsultationById,
  updateConsultation,
  completeConsultation,
};
