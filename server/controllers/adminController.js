const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

// ── Stats ──────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Aggregate platform-wide counts for the admin dashboard.
 */
const getPlatformStats = async (req, res) => {
  try {
    const [totalDoctors, totalPatients, totalAppointments, pendingAppointments] =
      await Promise.all([
        Doctor.countDocuments(),
        User.countDocuments({ role: 'patient' }),
        Appointment.countDocuments(),
        Appointment.countDocuments({ status: 'upcoming' }),
      ]);

    res.json({
      success: true,
      stats: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        pendingAppointments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform stats.',
      error: error.message,
    });
  }
};

// ── Doctors ────────────────────────────────────────────────────

/**
 * GET /api/admin/doctors
 * Return every doctor, populated with linked user account info.
 */
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate('user', 'name email role createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, doctors });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors.',
      error: error.message,
    });
  }
};

/**
 * POST /api/admin/doctors
 * Create a User (role: doctor) and a linked Doctor profile.
 */
const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      specialization,
      experience,
      availableDays,
      workingHours,
    } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'name, email, password, and specialization are required.',
      });
    }

    // Prevent duplicate email in User collection
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists.',
      });
    }

    // Hash the password explicitly (the pre-save hook would also hash,
    // but being explicit keeps the controller self-documenting).
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User record
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'doctor',
    });

    // Build Doctor profile fields
    const doctorFields = {
      user: user._id,
      name,
      email,
      specialization,
    };

    if (experience !== undefined) doctorFields.experience = experience;
    if (availableDays) doctorFields.workingDays = availableDays;
    if (workingHours) doctorFields.workingHours = workingHours;

    const doctor = await Doctor.create(doctorFields);

    res.status(201).json({
      success: true,
      doctor,
      message: 'Doctor created successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create doctor.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/admin/doctors/:id
 * Remove a Doctor profile and its linked User record.
 */
const deleteDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.',
      });
    }

    // Remove the linked User record if it exists
    if (doctor.user) {
      await User.findByIdAndDelete(doctor.user);
    }

    await Doctor.findByIdAndDelete(doctor._id);

    res.json({ success: true, message: 'Doctor removed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor.',
      error: error.message,
    });
  }
};

// ── Patients ───────────────────────────────────────────────────

/**
 * GET /api/admin/patients
 * Return all users with role "patient".
 */
const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'patient' })
      .select('_id name email createdAt')
      .sort({ createdAt: -1 });

    res.json({ success: true, patients });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/admin/patients/:id
 * Remove a patient user record.
 */
const deletePatient = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'patient',
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      });
    }

    res.json({ success: true, message: 'Patient removed successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient.',
      error: error.message,
    });
  }
};

// ── Appointments ───────────────────────────────────────────────

/**
 * GET /api/admin/appointments
 * Return all appointments with patient and doctor details.
 */
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('patient', 'fullName email')
      .populate('doctor', 'name specialization')
      .sort({ date: -1 });

    res.json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/admin/appointments/:id/status
 * Update an appointment's status (e.g. 'cancelled', 'completed').
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required.',
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    appointment.status = status;
    await appointment.save();

    const updated = await appointment.populate([
      { path: 'patient', select: 'fullName email' },
      { path: 'doctor', select: 'name specialization' },
    ]);

    res.json({ success: true, appointment: updated });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status.',
      error: error.message,
    });
  }
};

module.exports = {
  getPlatformStats,
  getAllDoctors,
  createDoctor,
  deleteDoctor,
  getAllPatients,
  deletePatient,
  getAllAppointments,
  updateAppointmentStatus,
};
