const express = require("express");
const router = express.Router();
const {
  createAppointment,
  getPatientAppointments,
  getAppointmentById,
  cancelAppointment,
} = require("../controllers/appointmentController");

router.post("/", createAppointment);
router.get("/patient/:patientId", getPatientAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id/cancel", cancelAppointment);

module.exports = router;