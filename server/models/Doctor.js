const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    experience: {
      type: Number,
      min: [0, "Experience cannot be negative."],
      max: [60, "Experience cannot exceed 60 years."],
    },
    qualifications: {
      type: String,
      trim: true,
      maxlength: [200, "Qualifications must be 200 characters or fewer."],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [1000, "Bio must be 1000 characters or fewer."],
    },
    languages: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: [40, "Each language must be 40 characters or fewer."],
        },
      ],
      validate: {
        validator: function (arr) {
          return arr.length <= 10;
        },
        message: "You can specify up to 10 languages.",
      },
    },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sun...6=Sat
    workingHours: {
      start: { type: String, default: "09:00" },
      end: { type: String, default: "17:00" },
    },
    slotDurationMinutes: { type: Number, default: 30 },
    breakTime: {
      start: { type: String, default: "" },
      end: { type: String, default: "" },
    },
    offDates: { type: [Date], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);