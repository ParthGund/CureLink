/**
 * Create a verified Doctor user account for testing logins.
 *
 * Usage:  node scripts/createDoctorAccount.js
 *
 * This is a ONE-TIME utility script. It:
 *   1. Creates (or updates) a User document with role "doctor".
 *   2. Creates (or updates) a linked Doctor profile with the same email.
 *
 * Safe to re-run — uses upsert so duplicates are not created.
 */

const path = require('path');

// Load .env from project root first, fall back to server-level .env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config(); // fallback — won't override already-set vars

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

// ── Credentials ────────────────────────────────────────────────
const DOCTOR_NAME = 'Dr. Ramesh Sharma';
const DOCTOR_EMAIL = 'doctor@curelink.com';
const DOCTOR_PASSWORD = 'Password@123';
const DOCTOR_ROLE = 'doctor';
const DOCTOR_SPECIALIZATION = 'General Medicine';

async function createDoctorAccount() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error('Error: No MongoDB connection string found.');
    console.error('Set MONGO_URI or MONGODB_URI in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    // ── 1. Hash the password manually (bypass the pre-save hook on upsert) ──
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DOCTOR_PASSWORD, salt);

    // ── 2. Upsert the User document ────────────────────────────
    const user = await User.findOneAndUpdate(
      { email: DOCTOR_EMAIL },
      {
        $set: {
          name: DOCTOR_NAME,
          password: hashedPassword,
          role: DOCTOR_ROLE,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log(`User upserted  →  _id: ${user._id}  email: ${user.email}`);

    // ── 3. Upsert the linked Doctor profile ────────────────────
    const doctor = await Doctor.findOneAndUpdate(
      { email: DOCTOR_EMAIL },
      {
        $set: {
          user: user._id,
          name: DOCTOR_NAME,
          specialization: DOCTOR_SPECIALIZATION,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, strict: false }
    );

    console.log(`Doctor upserted →  _id: ${doctor._id}  name: ${doctor.name}`);
    console.log('\nDoctor account ready for login:');
    console.log(`  Email:    ${DOCTOR_EMAIL}`);
    console.log(`  Password: ${DOCTOR_PASSWORD}`);
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

createDoctorAccount();
