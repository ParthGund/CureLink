/**
 * Seed the Doctor collection with sample clinician profiles.
 *
 * Usage:  npm run seed:doctors
 *         node scripts/seedDoctors.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const doctors = [
  {
    name: 'Dr. Ananya Sharma',
    specialization: 'Cardiologist',
    email: 'ananya.sharma@curelink.dev',
    workingDays: [1, 2, 3, 4, 5],       // Mon–Fri
    workingHours: { start: '09:00', end: '17:00' },
    slotDurationMinutes: 30,
  },
  {
    name: 'Dr. Rohan Mehta',
    specialization: 'Dermatologist',
    email: 'rohan.mehta@curelink.dev',
    workingDays: [1, 2, 3, 4, 5, 6],    // Mon–Sat
    workingHours: { start: '10:00', end: '16:00' },
    slotDurationMinutes: 20,
  },
  {
    name: 'Dr. Priya Desai',
    specialization: 'General Physician',
    email: 'priya.desai@curelink.dev',
    workingDays: [1, 2, 3, 4, 5],       // Mon–Fri
    workingHours: { start: '08:00', end: '14:00' },
    slotDurationMinutes: 30,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Doctor.deleteMany({});
    console.log('Cleared existing doctors');

    const created = await Doctor.insertMany(doctors);
    console.log(`Seeded ${created.length} doctors:`);
    created.forEach((d) => console.log(`  - ${d.name} (${d.specialization})`));
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seed();
