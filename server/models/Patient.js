const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    bloodGroup: { type: String, trim: true },
    address: { type: String, trim: true },
    emergencyContact: { type: String, trim: true },
    reasonForVisit: { type: String, trim: true },
    // Medical History fields
    allergies: { type: String, trim: true },
    chronicConditions: { type: String, trim: true },
    surgeries: { type: String, trim: true },
    currentMedications: { type: String, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Patient", patientSchema);