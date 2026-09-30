const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema(
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
    durationDays: {
      type: Number,
      min: [1, 'Duration in days must be at least 1.'],
      max: [365, 'Duration in days must be 365 or fewer.'],
      validate: {
        validator: function (v) {
          return v === undefined || v === null || Number.isInteger(v);
        },
        message: 'Duration in days must be a whole number.',
      },
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: [300, 'Instructions must be 300 characters or fewer.'],
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    consultation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
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
    items: {
      type: [prescriptionItemSchema],
      validate: {
        validator: function (arr) {
          return arr.length >= 1 && arr.length <= 20;
        },
        message: 'A prescription must have between 1 and 20 items.',
      },
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, createdAt: -1 });
prescriptionSchema.index({ doctor: 1, createdAt: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
