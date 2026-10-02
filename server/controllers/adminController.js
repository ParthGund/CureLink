const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const { validateDoctorCreation, validateDoctorUpdate } = require('../validators/doctorValidator');

// ── Stats ──────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Aggregate platform-wide counts for the admin dashboard.
 */
const getPlatformStats = async (req, res) => {
  try {
    const [
      totalDoctors,
      totalPatients,
      totalAppointments,
      pendingAppointments,
      scheduledCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      recentAppointments,
    ] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: { $in: ['upcoming', 'scheduled', 'confirmed'] } }),
      Appointment.countDocuments({ status: 'scheduled' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.find()
        .populate('patient', 'fullName')
        .populate('doctor', 'name specialization')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    res.json({
      success: true,
      stats: {
        totalDoctors,
        totalPatients,
        totalAppointments,
        pendingAppointments,
        statusBreakdown: {
          scheduled: scheduledCount,
          confirmed: confirmedCount,
          completed: completedCount,
          cancelled: cancelledCount,
        },
        recentAppointments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch platform stats.',
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
    });
  }
};

/**
 * POST /api/admin/doctors
 * Create a User (role: doctor) and a linked Doctor profile.
 * Uses a MongoDB transaction so both documents succeed or neither does.
 */
const createDoctor = async (req, res) => {
  // Validate input
  const { valid, errors } = validateDoctorCreation(req.body);
  if (!valid) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  const {
    name,
    email,
    password,
    specialization,
    experience,
    availableDays,
    workingHours,
  } = req.body;

  const trimmedEmail = email.trim().toLowerCase();

  // Check for duplicate email before starting the transaction
  const existingUser = await User.findOne({ email: trimmedEmail });
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'A user with this email already exists.',
    });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Create User record within the transaction.
    // Password hashing is handled by the User model's pre-save hook.
    const [user] = await User.create([{
      name: name.trim(),
      email: trimmedEmail,
      password,
      role: 'doctor',
    }], { session });

    // Build Doctor profile fields
    const doctorFields = {
      user: user._id,
      name: name.trim(),
      email: trimmedEmail,
      specialization: specialization.trim(),
    };

    if (experience !== undefined) doctorFields.experience = experience;
    if (availableDays) doctorFields.workingDays = availableDays;
    if (workingHours) doctorFields.workingHours = workingHours;

    const [doctor] = await Doctor.create([doctorFields], { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      doctor,
      message: 'Doctor created successfully.',
    });
  } catch (error) {
    await session.abortTransaction();

    res.status(500).json({
      success: false,
      message: 'Failed to create doctor.',
    });
  } finally {
    session.endSession();
  }
};

/**
 * PUT /api/admin/doctors/:id
 * Update an existing doctor's profile fields.
 * Only whitelisted fields are updated; email and password are not changeable.
 */
const updateDoctor = async (req, res) => {
  const { valid, errors } = validateDoctorUpdate(req.body);
  if (!valid) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found.',
      });
    }

    const { name, specialization, experience, availableDays, workingHours } = req.body;

    if (name !== undefined) doctor.name = name.trim();
    if (specialization !== undefined) doctor.specialization = specialization.trim();
    if (experience !== undefined) doctor.experience = Number(experience);
    if (availableDays !== undefined) doctor.workingDays = availableDays;
    if (workingHours !== undefined) doctor.workingHours = workingHours;

    await doctor.save();

    // Also update the linked User name if it was changed
    if (name !== undefined && doctor.user) {
      await User.findByIdAndUpdate(doctor.user, { name: name.trim() });
    }

    const updated = await Doctor.findById(doctor._id)
      .populate('user', 'name email role createdAt');

    res.json({ success: true, doctor: updated, message: 'Doctor updated successfully.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor.',
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

    res.json({ success: true, message: 'Doctor removed successfully.' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor.',
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
    });
  }
};

/**
 * DELETE /api/admin/patients/:id
 * Remove a patient user record.
 */
const deletePatient = async (req, res) => {
  // Hard deletion is disabled to prevent accidental destructive cascading and
  // leaving orphaned medical/appointment records.
  // TODO: Implement a proper data-retention policy and soft-delete/deactivation.
  return res.status(501).json({
    success: false,
    message: 'Hard deletion of patients is disabled to preserve medical history. Deactivation will be supported in a future update.',
  });
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
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'upcoming'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values are: scheduled, confirmed, completed, cancelled, upcoming.',
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
    });
  }
};

module.exports = {
  getPlatformStats,
  getAllDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAllPatients,
  deletePatient,
  getAllAppointments,
  updateAppointmentStatus,
};
