const mongoose = require("mongoose");

const slotSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor reference is required."],
      index: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required."],
    },
    startTime: {
      type: String,
      required: [true, "Start time is required."],
    },
    endTime: {
      type: String,
      required: [true, "End time is required."],
    },
    status: {
      type: String,
      enum: ["open", "cancelled"],
      default: "open",
    },
    isManual: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Unique constraint: one slot per doctor + date + startTime
slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

// Range query index for listing slots by doctor and date range
slotSchema.index({ doctor: 1, date: 1 });

module.exports = mongoose.model("Slot", slotSchema);
