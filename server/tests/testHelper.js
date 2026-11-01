const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');
const Prescription = require('../models/Prescription');
const Slot = require('../models/Slot');
const AuditLog = require('../models/AuditLog');

const TEST_DB_URI = process.env.TEST_MONGO_URI;

if (!TEST_DB_URI || !TEST_DB_URI.includes('curelink_test')) {
  throw new Error(
    'FATAL SAFETY GUARD: TEST_MONGO_URI must be configured and point to "curelink_test". Aborting tests to protect live database.'
  );
}

// Connect to the dedicated test database
async function connectTestDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
}

// Clean test collections
async function clearTestDB() {
  if (!mongoose.connection.name.includes('curelink_test')) {
    throw new Error('Safety guard: attempted to clear a non-test database!');
  }
  const collections = [
    User,
    Patient,
    Doctor,
    Appointment,
    Consultation,
    Prescription,
    Slot,
    AuditLog,
  ];
  for (const model of collections) {
    await model.deleteMany({});
  }
}

// Disconnect after tests
async function disconnectTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

// Helper: create a test user with a cookie string for supertest
async function createTestUser({ name, email, password = 'Password123!', role = 'patient', isActive = true }) {
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
    isActive,
  });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'testsecret',
    { expiresIn: '1d' }
  );

  const cookie = `jwt=${token}`;
  return { user, token, cookie };
}

// Helper: create a linked doctor profile
async function createTestDoctor({ name = 'Dr. Test Doctor', email = 'doctor@curelink.test', specialization = 'Cardiology' }) {
  const { user, cookie } = await createTestUser({
    name,
    email,
    role: 'doctor',
  });

  const doctor = await Doctor.create({
    user: user._id,
    name,
    specialization,
    email,
    experience: 8,
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 30,
  });

  return { user, doctor, cookie };
}

// Helper: create a linked patient profile
async function createTestPatient({ name = 'John Patient', email = 'patient@curelink.test', phone = '9876543210' }) {
  const { user, cookie } = await createTestUser({
    name,
    email,
    role: 'patient',
  });

  const patient = await Patient.create({
    userId: user._id,
    fullName: name,
    email,
    phone,
  });

  return { user, patient, cookie };
}

module.exports = {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
  createTestUser,
  createTestDoctor,
  createTestPatient,
};
