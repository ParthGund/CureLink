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

const TEST_DB_URI = process.env.TEST_MONGO_URI;

async function seedE2EData() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }

  // Clear test DB collections
  await User.deleteMany({});
  await Doctor.deleteMany({});
  await Patient.deleteMany({});
  await Appointment.deleteMany({});
  await Consultation.deleteMany({});
  await Prescription.deleteMany({});
  await Slot.deleteMany({});

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
