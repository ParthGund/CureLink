const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    medicine: {
      type: String,
      required: [true, 'Medicine name is required.'],
      trim: true,
      maxlength: [100, 'Medicine name must be 100 characters or fewer.'],
    },
    dosage: {
      type: String,
      trim: true,
      maxlength: [100, 'Dosage must be 100 characters or fewer.'],
    },
    frequency: {
      type: String,
      trim: true,
      maxlength: [100, 'Frequency must be 100 characters or fewer.'],
    },
    duration: {
      type: String,
      trim: true,
      maxlength: [100, 'Duration must be 100 characters or fewer.'],
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [300, 'Instructions must be 300 characters or fewer.'],
    },
  },
  { _id: false }
);

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
    prescriptions: {
      type: [prescriptionSchema],
      validate: {
        validator: function (arr) {
          return arr.length <= 20;
        },
        message: 'A consultation may have at most 20 prescriptions.',
      },
    },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

consultationSchema.index({ doctor: 1, createdAt: -1 });
consultationSchema.index({ patient: 1, status: 1, completedAt: -1 });

module.exports = mongoose.model('Consultation', consultationSchema);
