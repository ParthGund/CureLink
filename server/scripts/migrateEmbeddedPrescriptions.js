/**
 * One-off migration: move embedded prescriptions from Consultation
 * documents into standalone Prescription documents.
 *
 * Usage:  node scripts/migrateEmbeddedPrescriptions.js
 *
 * The Mongoose schema no longer includes the `prescriptions` field,
 * so this script reads raw documents via `Consultation.collection`.
 *
 * Idempotent: safe to run multiple times. Skips consultations that
 * already have a Prescription document. Prints counts only — never
 * patient data.
 */

const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const Consultation = require('../models/Consultation');

async function migrate() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) {
    console.error('Error: No MongoDB connection string found.');
    console.error('Set MONGO_URI or MONGODB_URI in your .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB\n');

    // Read raw documents that still have a non-empty prescriptions array
    const rawCollection = Consultation.collection;
    const cursor = rawCollection.find({
      prescriptions: { $exists: true, $ne: [], $type: 'array' },
    });

    const docs = await cursor.toArray();

    if (docs.length === 0) {
      console.log('Nothing to migrate.');
      return;
    }

    let created = 0;
    let skipped = 0;
    let unset = 0;

    for (const doc of docs) {
      // Check if a Prescription already exists for this consultation
      const existing = await Prescription.findOne({ consultation: doc._id });

      if (existing) {
        skipped++;
      } else {
        // Copy items without durationDays (field did not exist in the embedded schema)
        const items = doc.prescriptions.map((rx) => ({
          medicine: rx.medicine,
          dosage: rx.dosage,
          frequency: rx.frequency,
          duration: rx.duration,
          instructions: rx.instructions,
        }));

        await Prescription.create({
          consultation: doc._id,
          patient: doc.patient,
          doctor: doc.doctor,
          items,
        });
        created++;
      }

      // Remove the embedded field from the raw document
      await rawCollection.updateOne(
        { _id: doc._id },
        { $unset: { prescriptions: '' } }
      );
      unset++;
    }

    console.log(`Documents found with embedded prescriptions: ${docs.length}`);
    console.log(`Prescription documents created: ${created}`);
    console.log(`Skipped (already migrated): ${skipped}`);
    console.log(`Embedded fields removed: ${unset}`);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

migrate();
