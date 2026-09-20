const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getDoctors,
  getDoctorById,
  createDoctor,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/doctorController");
const {
  createSlots,
  listOwnSlots,
  updateSlot,
  deleteSlot,
  getAvailableSlots,
  getAvailability,
  generateFromWorkingHours,
  getSchedule,
  updateSchedule,
  cancelDay,
} = require('../controllers/scheduleController');

// Public doctor endpoints (any authenticated role)
router.get("/", protect, getDoctors);

// Doctor own-profile and slot management (must be before /:id routes)
router.get("/me", protect, authorize("doctor"), getMyProfile);
router.put("/me", protect, authorize("doctor"), updateMyProfile);
router.get("/me/slots", protect, authorize("doctor"), listOwnSlots);
router.post('/me/slots', protect, authorize('doctor'), createSlots);
router.post('/me/slots/from-working-hours', protect, authorize('doctor'), generateFromWorkingHours);
router.post('/me/slots/cancel-day', protect, authorize('doctor'), cancelDay);
router.put('/me/slots/:slotId', protect, authorize('doctor'), updateSlot);
router.delete('/me/slots/:slotId', protect, authorize('doctor'), deleteSlot);

router.get("/me/schedule", protect, authorize("doctor"), getSchedule);
router.put("/me/schedule", protect, authorize("doctor"), updateSchedule);

// Public doctor detail and availability (any authenticated role)
router.get("/:id", protect, getDoctorById);
router.get("/:id/slots", protect, getAvailableSlots);
router.get("/:id/availability", protect, getAvailability);

// Admin-only doctor creation
router.post("/", protect, authorize("admin"), createDoctor);

module.exports = router;
