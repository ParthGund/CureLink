const path = require('path');
require('../../server/node_modules/dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('../../server/node_modules/mongoose');
const User = require('../../server/models/User');
const Doctor = require('../../server/models/Doctor');
const Patient = require('../../server/models/Patient');
const Appointment = require('../../server/models/Appointment');
const Consultation = require('../../server/models/Consultation');
const Prescription = require('../../server/models/Prescription');
const Slot = require('../../server/models/Slot');
const AuditLog = require('../../server/models/AuditLog');

const TEST_DB_URI = process.env.TEST_MONGO_URI;

/**
 * Extracts the targeted MongoDB database name from a connection URI.
 * Handles mongodb:// and mongodb+srv:// formats, query options, and auth strings.
 */
function getMongoDatabaseName(uri) {
  if (!uri || typeof uri !== 'string') return '';
  try {
    const fakeHttpUrl = uri.replace(/^mongodb(\+srv)?:\/\//i, 'http://');
    const parsed = new URL(fakeHttpUrl);
    const rawPath = parsed.pathname.replace(/^\/+/, '');
    return rawPath.split('/')[0].trim();
  } catch {
    const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^\/]+\/([^?&#]+)/i);
    return match ? match[1].trim() : '';
  }
}

// ── CRITICAL SAFETY GUARD ──────────────────────────────────────────────
// Refuse to run unless TEST_MONGO_URI is explicitly set AND the parsed
// database name is exactly "curelink_test". This prevents accidental wipes
// of development or production databases.
if (!TEST_DB_URI) {
  console.error(
    'FATAL: TEST_MONGO_URI is not set. E2E seeding aborted to protect live databases.'
  );
  process.exit(1);
}

const parsedDbName = getMongoDatabaseName(TEST_DB_URI);
if (parsedDbName !== 'curelink_test') {
  console.error(
    `FATAL: TEST_MONGO_URI target database name must be exactly "curelink_test" (parsed: "${parsedDbName || 'none'}"). ` +
    `E2E seeding aborted to protect live databases.\n  URI (masked): ${TEST_DB_URI.replace(/\/\/[^@]+@/, '//***:***@')}`
  );
  process.exit(1);
}
// ────────────────────────────────────────────────────────────────────────

async function seedE2EData() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }

  // Double-check the connected database name at runtime
  const dbName = mongoose.connection.db?.databaseName || mongoose.connection.name || '';
  if (dbName !== 'curelink_test') {
    await mongoose.disconnect();
    throw new Error(
      `FATAL: Connected database name "${dbName}" is not "curelink_test". Aborting to protect live data.`
    );
  }

  // Clear test DB collections
  await User.deleteMany({});
  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  await Appointment.deleteMany({});
  await Consultation.deleteMany({});
  await Prescription.deleteMany({});
  await Slot.deleteMany({});
  await AuditLog.deleteMany({});

  // 1. Create Admin
  await User.create({
    name: 'Admin Test User',
    email: 'admin@curelink.test',
    password: 'Password123!',
    role: 'admin',
  });

  // 2. Create Doctor User & Profile
  const doctorUser = await User.create({
    name: 'Dr. Sarah Connor',
    email: 'doctor@curelink.test',
    password: 'Password123!',
    role: 'doctor',
  });

  await Doctor.create({
    user: doctorUser._id,
    name: 'Dr. Sarah Connor',
    specialization: 'Cardiology',
    email: 'doctor@curelink.test',
    experience: 12,
    qualifications: 'MD, FACC',
    bio: 'Specialist in preventive cardiology and heart rhythm.',
    workingDays: [1, 2, 3, 4, 5],
    workingHours: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 30,
  });

  // 3. Create Patient User & Profile
  const patientUser = await User.create({
    name: 'John Doe',
    email: 'patient@curelink.test',
    password: 'Password123!',
    role: 'patient',
  });

  await Patient.create({
    userId: patientUser._id,
    fullName: 'John Doe',
    email: 'patient@curelink.test',
    phone: '9876543210',
    dateOfBirth: new Date('1990-01-15'),
    gender: 'male',
    bloodGroup: 'O+',
  });

  await mongoose.disconnect();
}

module.exports = { seedE2EData };
