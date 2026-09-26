const appointmentService = require('../services/appointmentService');
const { sendError } = require('../utils/httpError');
const { validateAppointmentCreation, validateAppointmentId } = require('../validators/appointmentValidator');

/**
 * POST /api/appointments
 * Book a new appointment for the authenticated patient.
 *
 * The patient identity is derived from req.user — the client
 * may supply supplementary patient data (phone, dob, gender)
 * but cannot control which patient the appointment belongs to.
 */
const createAppointment = async (req, res) => {
  try {
    const { valid, errors } = validateAppointmentCreation(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const { patient: patientData, doctorId, date, timeSlot, reason } = req.body;

    const appointment = await appointmentService.bookAppointment(req.user, {
      doctorId,
      date,
      timeSlot,
      reason: reason || (patientData && patientData.reasonForVisit) || '',
      patientData: patientData || {},
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This slot was just booked. Please choose another.',
      });
    }
    sendError(res, error, 'Failed to book appointment.');
  }
};

/**
 * GET /api/appointments/me
 * Get appointments for the currently authenticated patient.
 * Patient is derived from req.user — no client-supplied ID needed.
 */
const getMyAppointments = async (req, res) => {
  try {
    const appointments = await appointmentService.getMyAppointments(req.user._id);
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    sendError(res, error, 'Failed to fetch appointments.');
  }
};

/**
 * GET /api/appointments/patient/:patientId
 * Legacy endpoint — kept for backward compatibility.
 * Enforces ownership: a patient can only fetch their own appointments.
 * Admins can access any patient's appointments.
 */
const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Ownership check: the patientId param must match the authenticated user's patient
    if (req.user.role !== 'admin') {
      const patient = await appointmentService.getPatientForUser(req.user._id);

      if (!patient || !patient._id.equals(patientId)) {
        return res.status(403).json({
          success: false,
          message: 'You can only view your own appointments.',
        });
      }
    }

    const Appointment = require('../models/Appointment');

    const appointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name specialization email')
      .sort({ date: -1, timeSlot: 1 });

    res.status(200).json({ success: true, appointments });
  } catch (error) {
    sendError(res, error, 'Failed to fetch appointments.');
  }
};

/**
 * GET /api/appointments/:id
 * Get a single appointment by ID.
 * Enforces authorization: only the owning patient, assigned doctor, or admin.
 */
const getAppointmentById = async (req, res) => {
  try {
    const { valid, errors } = validateAppointmentId(req.params.id);
    if (!valid) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const appointment = await appointmentService.getAppointmentById(
      req.params.id,
      req.user
    );
    res.status(200).json({ success: true, appointment });
  } catch (error) {
    sendError(res, error, 'Failed to fetch appointment.');
  }
};

/**
 * PUT /api/appointments/:id/cancel
 * Cancel an appointment.
 * Enforces authorization: only the owning patient, assigned doctor, or admin.
 */
const cancelAppointment = async (req, res) => {
  try {
    const { valid, errors } = validateAppointmentId(req.params.id);
    if (!valid) {
      return res.status(400).json({ success: false, message: errors[0] });
    }

    const appointment = await appointmentService.cancelAppointment(
      req.params.id,
      req.user
    );
    res.status(200).json({ success: true, appointment });
  } catch (error) {
    sendError(res, error, 'Failed to cancel appointment.');
  }
};

/**
 * GET /api/appointments/doctor/me
 * Get appointments for the currently authenticated doctor.
 * Doctor is derived from req.user — no client-supplied ID needed.
 */
const getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await appointmentService.getDoctorAppointments(req.user._id);
    res.status(200).json({ success: true, appointments });
  } catch (error) {
    sendError(res, error, 'Failed to fetch appointments.');
  }
};

module.exports = {
  createAppointment,
  getMyAppointments,
  getPatientAppointments,
  getDoctorAppointments,
  getAppointmentById,
  cancelAppointment,
};