const mongoose = require('mongoose');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
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
      upcomingCount,
      scheduledCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      missedCount,
      recentAppointments,
    ] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: { $in: ['upcoming', 'scheduled', 'confirmed'] } }),
      Appointment.countDocuments({ status: 'upcoming' }),
      Appointment.countDocuments({ status: 'scheduled' }),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.countDocuments({ status: 'missed' }),
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
          upcoming: upcomingCount,
          scheduled: scheduledCount,
          confirmed: confirmedCount,
          completed: completedCount,
          cancelled: cancelledCount,
          missed: missedCount,
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

  const userDoc = {
    name: name.trim(),
    email: trimmedEmail,
    password,
    role: 'doctor',
  };

  const doctorFields = {
    name: name.trim(),
    email: trimmedEmail,
    specialization: specialization.trim(),
  };

  if (experience !== undefined) doctorFields.experience = experience;
  if (availableDays) doctorFields.workingDays = availableDays;
  if (workingHours) doctorFields.workingHours = workingHours;

  try {
    session.startTransaction();
    const [user] = await User.create([userDoc], { session });
    const [doctor] = await Doctor.create([{ ...doctorFields, user: user._id }], { session });
    await session.commitTransaction();
    return res.status(201).json({ success: true, doctor, message: 'Doctor created successfully.' });
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
    }

    if (!/replica set|Transaction numbers/i.test(err.message)) {
      return res.status(500).json({ success: false, message: 'Failed to create doctor.', error: err.message });
    }

    // Fallback for standalone MongoDB without transactions
    let user;
    try {
      user = await User.create(userDoc);
    } catch (createErr) {
      if (createErr.code === 11000) {
        return res.status(409).json({ success: false, message: 'A user with this email already exists.' });
      }
      return res.status(500).json({ success: false, message: 'Failed to create doctor.', error: createErr.message });
    }

    try {
      const doctor = await Doctor.create({ ...doctorFields, user: user._id });
      return res.status(201).json({ success: true, doctor, message: 'Doctor created successfully.' });
    } catch (e) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ success: false, message: 'Failed to create doctor.', error: e.message });
    }
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

    // Guard: reject if the doctor has any active/upcoming appointments
    const activeCount = await Appointment.countDocuments({
      doctor: doctor._id,
      status: { $in: ['scheduled', 'confirmed', 'upcoming'] },
    });

    if (activeCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete this doctor because they have ${activeCount} active/upcoming appointment(s). Cancel or complete them first.`,
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
      .select('_id name email isActive createdAt')
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
 * PATCH /api/admin/patients/:id/deactivate
 * Soft-deactivate a patient account.
 * Sets isActive = false on the User document.
 * Does NOT delete any medical records, appointments, or related data.
 */
const deactivatePatient = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      });
    }

    if (user.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Only patient accounts can be deactivated through this endpoint.',
      });
    }

    if (user.isActive === false) {
      return res.status(409).json({
        success: false,
        message: 'This account is already deactivated.',
      });
    }

    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'Patient account deactivated successfully.',
      patient: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate patient account.',
    });
  }
};

/**
 * PATCH /api/admin/patients/:id/reactivate
 * Re-activate a previously deactivated patient account.
 * Sets isActive = true — all existing medical records are untouched.
 */
const reactivatePatient = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      });
    }

    if (user.role !== 'patient') {
      return res.status(400).json({
        success: false,
        message: 'Only patient accounts can be reactivated through this endpoint.',
      });
    }

    if (user.isActive === true) {
      return res.status(409).json({
        success: false,
        message: 'This account is already active.',
      });
    }

    user.isActive = true;
    await user.save();

    res.json({
      success: true,
      message: 'Patient account reactivated successfully.',
      patient: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate patient account.',
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
    });
  }
};

/**
 * PUT /api/admin/appointments/:id/status
 * Update an appointment's status through permitted lifecycle transitions.
 * Completion is reserved for completeConsultation so its diagnosis and
 * consultation updates cannot be bypassed.
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'upcoming', 'missed'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values are: scheduled, confirmed, completed, cancelled, upcoming, missed.',
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.',
      });
    }

    // ── Lifecycle transition table ─────────────────────────────
    // Defines the complete set of valid status transitions.
    // Any transition not listed here is rejected.
    const ALLOWED_TRANSITIONS = {
      scheduled: new Set(['upcoming', 'confirmed', 'cancelled', 'missed']),
      upcoming:  new Set(['confirmed', 'cancelled', 'missed']),
      confirmed: new Set(['cancelled', 'missed']),
      // Terminal states: no transitions permitted
      completed: new Set(),
      cancelled: new Set(),
      missed:    new Set(),
    };

    const from = appointment.status;

    if (from === status) {
      return res.status(409).json({
        success: false,
        message: `Appointment is already ${status}.`,
      });
    }

    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed || !allowed.has(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition appointment from '${from}' to '${status}'.`,
      });
    }

    if (status === 'cancelled' && await Consultation.exists({ appointment: appointment._id })) {
      return res.status(409).json({
        success: false,
        message: 'Cannot cancel an appointment that has an active or completed consultation.',
      });
    }

    // Conditional update prevents concurrent admin requests from applying a
    // transition based on a stale status read.
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: appointment._id, status: from },
      { $set: { status } },
      { new: true, runValidators: true }
    ).populate([
      { path: 'patient', select: 'fullName email' },
      { path: 'doctor', select: 'name specialization' },
    ]);
    if (!updatedAppointment) {
      return res.status(409).json({ success: false, message: 'Appointment changed. Refresh and try again.' });
    }

    res.json({ success: true, appointment: updatedAppointment });
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
  deactivatePatient,
  reactivatePatient,
  getAllAppointments,
  updateAppointmentStatus,
};
