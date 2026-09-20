const doctorService = require("../services/doctorService");
const scheduleService = require("../services/scheduleService");
const { sendError } = require("../utils/httpError");

/**
 * POST /api/doctors/me/slots
 * Create time slots from a time window.
 */
const createSlots = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    const slots = await scheduleService.createSlots(doctor._id, req.body);
    res.status(201).json({ success: true, slots });
  } catch (error) {
    sendError(res, error, "Failed to create time slots.");
  }
};

/**
 * GET /api/doctors/me/slots
 * List the logged-in doctor's own slots with booking status.
 */
const listOwnSlots = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    const { from, to } = req.query;
    const slots = await scheduleService.listOwnSlots(doctor._id, { from, to });
    res.status(200).json({ success: true, slots });
  } catch (error) {
    sendError(res, error, "Failed to fetch time slots.");
  }
};

/**
 * PUT /api/doctors/me/slots/:slotId
 * Update a single slot.
 */
const updateSlot = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    const slot = await scheduleService.updateSlot(doctor._id, req.params.slotId, req.body);
    res.status(200).json({ success: true, slot });
  } catch (error) {
    sendError(res, error, "Failed to update time slot.");
  }
};

/**
 * DELETE /api/doctors/me/slots/:slotId
 * Remove a single slot.
 */
const deleteSlot = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    await scheduleService.deleteSlot(doctor._id, req.params.slotId);
    res.status(200).json({ success: true, message: "Time slot removed." });
  } catch (error) {
    sendError(res, error, "Failed to remove time slot.");
  }
};

/**
 * GET /api/doctors/:id/slots?date=YYYY-MM-DD
 * Available slot labels for a date (backward-compatible contract).
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Query param 'date' (YYYY-MM-DD) is required." });
    }

    const slots = await scheduleService.getAvailableLabelsForDate(req.params.id, date);
    res.status(200).json({ success: true, slots });
  } catch (error) {
    sendError(res, error, "Failed to fetch available slots.");
  }
};

/**
 * GET /api/doctors/:id/availability?from=&to=
 * Availability over a date range for the patient-side profile page.
 */
const getAvailability = async (req, res) => {
  try {
    const { from, to } = req.query;
    const availability = await scheduleService.getAvailabilityRange(req.params.id, { from, to });
    res.status(200).json({ success: true, availability });
  } catch (error) {
    sendError(res, error, "Failed to fetch availability.");
  }
};

/**
 * POST /api/doctors/me/slots/from-working-hours
 * Generate slots for the next 30 days from the doctor's working-hours pattern.
 */
const generateFromWorkingHours = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    const { created, skipped } = await scheduleService.generateSlotsFromWorkingHours(doctor._id);
    const status = created > 0 ? 201 : 200;
    const message = created > 0
      ? `Added ${created} time slots for the next 30 days.`
      : 'Your working hours are already covered. Nothing new to add.';
    res.status(status).json({ success: true, created, skipped, message });
  } catch (error) {
    sendError(res, error, 'Failed to generate time slots.');
  }
};

const getSchedule = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    const schedule = await scheduleService.getSchedule(doctor._id);
    res.status(200).json({ success: true, schedule });
  } catch (error) {
    sendError(res, error, 'Failed to get schedule settings.');
  }
};

const updateSchedule = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    const result = await scheduleService.updateSchedule(doctor._id, req.body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    sendError(res, error, 'Failed to update schedule settings.');
  }
};

const cancelDay = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorForUser(req.user._id);
    const result = await scheduleService.cancelDay(doctor._id, req.body.date);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    sendError(res, error, 'Failed to cancel day.');
  }
};

module.exports = {
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
};
