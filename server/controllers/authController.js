const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validateRegistration, validateLogin } = require('../validators/authValidator');
const { validatePatientProfileUpdate } = require('../validators/patientProfileValidator');

const PATIENT_PROFILE_SELECT = [
  'fullName', 'email', 'phone', 'dateOfBirth', 'gender', 'bloodGroup', 'address',
  'emergencyContact', 'allergies', 'chronicConditions', 'surgeries', 'currentMedications',
].join(' ');

/**
 * @desc    Register a new patient account
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerPatient = async (req, res) => {
  try {
    const { valid, errors } = validateRegistration(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const { name, email, password } = req.body;
    const trimmedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: trimmedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Public registration ALWAYS creates a patient.
    // Admin and doctor accounts are created through controlled server-side mechanisms.
    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password,
      role: 'patient',
    });

    generateToken(res, user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

/**
 * @desc    Login an existing user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginPatient = async (req, res) => {
  try {
    const { valid, errors } = validateLogin(req.body);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Deactivated patient accounts cannot log in.
    // Admins and doctors are exempt from this restriction.
    if (user.role === 'patient' && user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    generateToken(res, user._id, user.role);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

/**
 * @desc    Logout user and clear auth cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (requires protect middleware)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    let patientData = null;
    if (user.role === 'patient') {
      const Patient = require('../models/Patient');
      patientData = await Patient.findOne({ userId: user._id }).select(PATIENT_PROFILE_SELECT);
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        patient: patientData,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile.',
    });
  }
};

/**
 * @desc    Update current authenticated user (and patient profile if patient)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = async (req, res) => {
  try {
    if (req.user.role === 'patient') {
      const { valid, errors } = validatePatientProfileUpdate(req.body);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: errors[0],
          errors,
        });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Only the authenticated user's basic account fields are mutable here.
    let userChanged = false;
    if (req.body.name !== undefined) {
      user.name = req.body.name.trim();
      userChanged = true;
    }
    if (req.body.email !== undefined) {
      user.email = req.body.email.trim().toLowerCase();
      userChanged = true;
    }
    if (req.body.phone !== undefined) {
      user.phone = req.body.phone.trim();
      userChanged = true;
    }
    if (userChanged) await user.save();

    let patientData = null;
    if (user.role === 'patient') {
      const Patient = require('../models/Patient');
      let patient = await Patient.findOne({ userId: user._id });
      
      if (!patient) {
        // Fallback for an uninitialized patient profile
        patient = new Patient({
          userId: user._id,
          fullName: user.name,
          email: user.email,
          phone: user.phone
        });
      } else {
        patient.fullName = user.name;
        patient.email = user.email;
      }

      if (req.body.phone !== undefined || user.phone) patient.phone = user.phone || '';
      if (req.body.dateOfBirth !== undefined) patient.dateOfBirth = req.body.dateOfBirth || null;
      if (req.body.gender !== undefined) patient.gender = req.body.gender || undefined;
      if (req.body.bloodGroup !== undefined) patient.bloodGroup = req.body.bloodGroup || undefined;
      for (const field of [
        'address', 'emergencyContact', 'allergies', 'chronicConditions',
        'surgeries', 'currentMedications',
      ]) {
        if (req.body[field] !== undefined) patient[field] = req.body[field];
      }

      await patient.save();
      patientData = await Patient.findById(patient._id).select(PATIENT_PROFILE_SELECT);
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        patient: patientData,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    if (error.name === 'ValidationError') {
      const firstError = Object.values(error.errors)[0]?.message || 'Profile information is invalid.';
      return res.status(400).json({ success: false, message: firstError });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
    });
  }
};

module.exports = {
  registerPatient,
  loginPatient,
  logoutUser,
  getMe,
  updateMe,
};
