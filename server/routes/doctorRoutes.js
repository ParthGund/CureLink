const express = require("express");
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  getAvailableSlots,
} = require("../controllers/doctorController");

router.get("/", getDoctors);
router.post("/", createDoctor);
router.get("/:id", getDoctorById);
router.get("/:id/slots", getAvailableSlots);

module.exports = router;