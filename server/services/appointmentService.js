const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { httpError } = require('../utils/httpError');
const scheduleService = require('./scheduleService');
const { toIsoDate } = require('../utils/timeUtils');

/**
 * Get the Patient document linked to an authenticated user.
 *
 * @param {string} userId - User._id from req.user.
 * @returns {Promise<object|null>} Patient document or null.
 */
async function getPatientForUser(userId) {
  return Patient.findOne({ userId });
}

/**
 * Get or create a Patient linked to the authenticated user.
 *
 * Supplementary fields (phone, dateOfBirth, gender) may be provided
 * from the request body. Identity (userId, fullName, email) always
 * comes from the authenticated user — never from the client.
 *
 * @param {object} user - req.user (User document).
 * @param {object} supplementary - Additional patient data from request body.
 * @returns {Promise<object>} Patient document.
 */
async function getOrCreatePatient(user, supplementary = {}) {
  let patient = await getPatientForUser(user._id);

  if (patient) {
    // Update supplementary fields if provided
    let changed = false;

    if (supplementary.phone && supplementary.phone !== patient.phone) {
      patient.phone = supplementary.phone;
      changed = true;
    }
    if (supplementary.dateOfBirth !== undefined) {
      patient.dateOfBirth = supplementary.dateOfBirth;
      changed = true;
    }
    if (supplementary.gender !== undefined) {
      patient.gender = supplementary.gender;
      changed = true;
    }

    if (changed) await patient.save();
    return patient;
  }

  // Phone is required by the Patient schema
  if (!supplementary.phone) {
    throw httpError(400, 'Phone number is required for your first appointment booking.');
  }

  patient = await Patient.create({
    fullName: user.name,
    email: user.email,
    phone: supplementary.phone,
    dateOfBirth: supplementary.dateOfBirth || undefined,
    gender: supplementary.gender || undefined,
    userId: user._id,
  });

  return patient;
}

/**
 * Book an appointment for the authenticated user.
 *
 * The patient identity is derived from req.user — the client cannot
 * specify which patient the appointment belongs to.
 *
 * @param {object} user - req.user (authenticated User document).
 * @param {object} input - { doctorId, date, timeSlot, reason, patientData }.
 * @returns {Promise<object>} Populated appointment document.
 */
async function bookAppointment(user, { doctorId, date, timeSlot, reason, patientData }) {
  // Validate doctor
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw httpError(400, 'Invalid doctor ID.');
  }

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw httpError(404, 'Doctor not found.');
  }

  // Get or create patient from authenticated user
  const patient = await getOrCreatePatient(user, patientData || {});

  // Validate date
  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    throw httpError(400, 'Invalid date format.');
  }

  // Validate timeSlot
  if (!timeSlot || typeof timeSlot !== 'string' || timeSlot.trim().length === 0) {
    throw httpError(400, 'Time slot is required.');
  }

  const dayStart = new Date(appointmentDate);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(appointmentDate);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const isoDate = toIsoDate(appointmentDate);
  const availableLabels = await scheduleService.getAvailableLabelsForDate(doctorId, isoDate);

  if (!availableLabels.includes(timeSlot)) {
    throw httpError(400, 'The requested time slot is invalid, unavailable, or does not exist for this date.');
  }

  // Create appointment
  const appointment = await Appointment.create({
    patient: patient._id,
    doctor: doctorId,
    date: dayStart,
    timeSlot,
    reason: reason || '',
    status: 'upcoming',
  });

  return appointment.populate(['patient', 'doctor']);
}

/**
 * Get appointments for the authenticated user's patient profile.
 *
 * @param {string} userId - User._id from req.user.
 * @returns {Promise<object[]>} Array of appointment documents.
 */
async function getMyAppointments(userId) {
  const patient = await getPatientForUser(userId);

  if (!patient) {
    return [];
  }

  return Appointment.find({ patient: patient._id })
    .populate('doctor', 'name specialization email')
    .sort({ date: -1, timeSlot: 1 });
}

/**
 * Get appointment by ID with ownership verification.
 *
 * Only the owning patient, assigned doctor, or an admin may view.
 *
 * @param {string} appointmentId - Appointment._id.
 * @param {object} user - req.user (authenticated User document).
 * @returns {Promise<object>} Populated appointment document.
 */
async function getAppointmentById(appointmentId, user) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw httpError(404, 'Appointment not found.');
  }

  const appointment = await Appointment.findById(appointmentId)
    .populate(['patient', 'doctor']);

  if (!appointment) {
    throw httpError(404, 'Appointment not found.');
  }

  await verifyAppointmentAccess(appointment, user);

  return appointment;
}

/**
 * Cancel an appointment with ownership verification.
 *
 * Only the owning patient, assigned doctor, or an admin may cancel.
 *
 * @param {string} appointmentId - Appointment._id.
 * @param {object} user - req.user (authenticated User document).
 * @returns {Promise<object>} Updated appointment document.
 */
async function cancelAppointment(appointmentId, user) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    throw httpError(404, 'Appointment not found.');
  }

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw httpError(404, 'Appointment not found.');
  }

  await verifyAppointmentAccess(appointment, user);

  if (appointment.status === 'cancelled') {
    throw httpError(400, 'Appointment is already cancelled.');
  }

  appointment.status = 'cancelled';
  await appointment.save();

  return appointment;
}

/**
 * Verify that the authenticated user has access to an appointment.
 *
 * Allowed relationships:
 *   - Patient who owns the appointment
 *   - Doctor assigned to the appointment
 *   - Admin
 *
 * @param {object} appointment - Appointment document (may be populated or not).
 * @param {object} user - req.user (authenticated User document).
 * @throws {Error} 403 if the user does not have access.
 */
async function verifyAppointmentAccess(appointment, user) {
  // Admins can access any appointment
  if (user.role === 'admin') return;

  // Doctor assigned to the appointment
  if (user.role === 'doctor') {
    const doctor = await Doctor.findOne({ user: user._id });
    const appointmentDoctorId = appointment.doctor._id || appointment.doctor;

    if (doctor && doctor._id.equals(appointmentDoctorId)) {
      return;
    }

    throw httpError(403, 'You do not have access to this appointment.');
  }

  // Patient who owns the appointment
  if (user.role === 'patient') {
    const patient = await getPatientForUser(user._id);
    const appointmentPatientId = appointment.patient._id || appointment.patient;

    if (patient && patient._id.equals(appointmentPatientId)) {
      return;
    }

    throw httpError(403, 'You do not have access to this appointment.');
  }

  throw httpError(403, 'You do not have access to this appointment.');
}

module.exports = {
  getPatientForUser,
  getOrCreatePatient,
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  cancelAppointment,
  verifyAppointmentAccess,
};
