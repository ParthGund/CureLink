const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sun...6=Sat
    workingHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "17:00" },
    },
    slotDurationMinutes: { type: Number, default: 30 },
    offDates: { type: [Date], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);