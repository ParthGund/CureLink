const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({});
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctors", error: error.message });
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch doctor", error: error.message });
  }
};

const createDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json(doctor);
  } catch (error) {
    res.status(400).json({ message: "Failed to create doctor", error: error.message });
  }
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const toDisplayTime = (mins) => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
};

const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: "Query param 'date' (YYYY-MM-DD) is required" });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const requestedDate = new Date(date);
    if (isNaN(requestedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const dayOfWeek = requestedDate.getUTCDay();

    if (!doctor.workingDays.includes(dayOfWeek)) {
      return res.status(200).json({ slots: [] });
    }

    const isOff = doctor.offDates.some(
      (off) => new Date(off).toDateString() === requestedDate.toDateString()
    );
    if (isOff) {
      return res.status(200).json({ slots: [] });
    }

    const startMins = toMinutes(doctor.workingHours.start);
    const endMins = toMinutes(doctor.workingHours.end);
    const duration = doctor.slotDurationMinutes;

    const allSlots = [];
    for (let t = startMins; t + duration <= endMins; t += duration) {
      allSlots.push(toDisplayTime(t));
    }

    const dayStart = new Date(requestedDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const bookedAppointments = await Appointment.find({
      doctor: doctor._id,
      date: { $gte: dayStart, $lte: dayEnd },
      status: "upcoming",
    }).select("timeSlot");

    const bookedSlots = new Set(bookedAppointments.map((a) => a.timeSlot));
    const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

    res.status(200).json({ slots: availableSlots });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch slots", error: error.message });
  }
};

module.exports = { getDoctors, getDoctorById, createDoctor, getAvailableSlots };