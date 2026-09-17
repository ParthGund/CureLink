const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

const createAppointment = async (req, res) => {
  try {
    const { patient, doctorId, date, timeSlot, reason } = req.body;

    if (!patient || !doctorId || !date || !timeSlot) {
      return res.status(400).json({
        message: "patient, doctorId, date and timeSlot are all required",
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    let patientDoc = await Patient.findOne({ email: patient.email });
    if (!patientDoc) {
      patientDoc = await Patient.create(patient);
    } else {
      patientDoc.set(patient);
      await patientDoc.save();
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const dayStart = new Date(appointmentDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const clash = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      timeSlot,
      status: "upcoming",
    });

    if (clash) {
      return res.status(409).json({ message: "This slot was just booked. Please choose another." });
    }

    const appointment = await Appointment.create({
      patient: patientDoc._id,
      doctor: doctorId,
      date: dayStart,
      timeSlot,
      reason,
      status: "upcoming",
    });

    const populated = await appointment.populate(["patient", "doctor"]);
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This slot was just booked. Please choose another." });
    }
    res.status(500).json({ message: "Failed to book appointment", error: error.message });
  }
};

const getPatientAppointments = async (req, res) => {
  try {
    const { patientId } = req.params;

    const appointments = await Appointment.find({ patient: patientId })
      .populate("doctor", "name specialization email")
      .sort({ date: -1, timeSlot: 1 });

    res.status(200).json({ success: true, appointments });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointments", error: error.message });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(["patient", "doctor"]);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch appointment", error: error.message });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel appointment", error: error.message });
  }
};

module.exports = {
  createAppointment,
  getPatientAppointments,
  getAppointmentById,
  cancelAppointment,
};