const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    chiefComplaint: {
      type: String,
      trim: true,
      maxlength: [500, 'Chief complaint must be 500 characters or fewer.'],
    },
    diagnosis: {
      type: String,
      trim: true,
      maxlength: [1000, 'Diagnosis must be 1000 characters or fewer.'],
    },
    clinicalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Clinical notes must be 2000 characters or fewer.'],
    },
    treatmentPlan: {
      type: String,
      trim: true,
      maxlength: [2000, 'Treatment plan must be 2000 characters or fewer.'],
    },
    followUpDate: {
      type: Date,
    },
    followUpInstructions: {
      type: String,
      trim: true,
      maxlength: [1000, 'Follow-up instructions must be 1000 characters or fewer.'],
    },
    prescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

consultationSchema.index({ doctor: 1, createdAt: -1 });
consultationSchema.index({ patient: 1, status: 1, completedAt: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);

