const mongoose = require("mongoose");
const Slot = require("../models/Slot");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const { httpError } = require("../utils/httpError");
const {
  toMinutes,
  toDisplayTime,
  isValidTime,
  parseIsoDate,
  toIsoDate,
  addDays,
} = require("../utils/timeUtils");

// Allowed slot durations in minutes.
const ALLOWED_DURATIONS = [15, 20, 30, 45, 60];

// Maximum slots that can be created in a single request.
const MAX_SLOTS_PER_REQUEST = 60;

// ── Helpers ────────────────────────────────────────────────────

/**
 * Get today's date as a "YYYY-MM-DD" string in the server's local timezone.
 */
function todayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get the current server time as total minutes since midnight (local).
 */
function nowMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Validate that a doctor exists by document id.
 * @throws {Error} 404 if invalid id or not found.
 */
async function requireDoctor(doctorId) {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw httpError(404, "Doctor not found.");
  }
  const doctor = await Doctor.findById(doctorId).select("_id workingDays workingHours slotDurationMinutes breakTime offDates");
  if (!doctor) {
    throw httpError(404, "Doctor not found.");
  }
  return doctor;
}

/**
 * Check whether two time ranges overlap.
 * Overlap = startA < endB && startB < endA (in minutes).
 */
function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

/**
 * Build a UTC day range for querying Appointment/Slot by calendar date.
 * @param {Date} utcMidnight - A UTC-midnight Date.
 * @returns {{ dayStart: Date, dayEnd: Date }}
 */
function dayRange(utcMidnight) {
  const dayStart = new Date(utcMidnight);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(utcMidnight);
  dayEnd.setUTCHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
}

/**
 * Query booked timeSlot labels for a doctor within a date range.
 * Returns a Set of "label" strings.
 */
async function bookedLabelsInRange(doctorId, dateStart, dateEnd) {
  const appointments = await Appointment.find({
    doctor: doctorId,
    date: { $gte: dateStart, $lte: dateEnd },
    status: { $in: ['scheduled', 'confirmed', 'upcoming'] },
  }).select('timeSlot date');

  // Build a set of "YYYY-MM-DD|label" keys for multi-date disambiguation.
  const set = new Set();
  for (const a of appointments) {
    const key = toIsoDate(a.date) + "|" + a.timeSlot;
    set.add(key);
  }
  return set;
}

/**
 * Build the display label for a slot from its startTime.
 */
function slotLabel(slot) {
  return toDisplayTime(toMinutes(slot.startTime));
}

/**
 * Format a slot for API responses (own-slots shape).
 */
function formatOwnSlot(slot, isBooked) {
  return {
    id: slot._id,
    date: toIsoDate(slot.date),
    startTime: slot.startTime,
    endTime: slot.endTime,
    label: slotLabel(slot),
    isBooked,
    status: slot.status || "open",
  };
}

/**
 * Format a slot for availability responses (public shape — no isBooked).
 */
function formatAvailabilitySlot(slot) {
  return {
    id: slot._id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    label: slotLabel(slot),
  };
}

// ── Shared helper: generate slots from working-hours pattern ──────

/**
 * Compute the list of { startTime, endTime } slots for a given calendar date
 * using a doctor's working-hours pattern.  Pure function — no DB access.
 *
 * @param {object} doctor - Doctor document (must have workingDays, workingHours, slotDurationMinutes, offDates).
 * @param {string} isoDate - Calendar date in "YYYY-MM-DD" format.
 * @returns {{ startTime: string, endTime: string }[]} Array of 24-h "HH:mm" time pairs.
 */
function buildDaySlots(doctor, isoDate) {
  try {
    const utcMidnight = parseIsoDate(isoDate);
    if (!utcMidnight) return [];

    // 1. Weekday check (UTC convention: same as parseIsoDate)
    const weekday = utcMidnight.getUTCDay(); // 0=Sun … 6=Sat
    if (
      !Array.isArray(doctor.workingDays) ||
      doctor.workingDays.length === 0 ||
      !doctor.workingDays.includes(weekday)
    ) return [];

    // 2. Off-date check — compare as YYYY-MM-DD strings using UTC components
    if (Array.isArray(doctor.offDates)) {
      for (const off of doctor.offDates) {
        if (off && toIsoDate(new Date(off)) === isoDate) return [];
      }
    }

    // 3. Validate times
    const startStr = doctor.workingHours && doctor.workingHours.start;
    const endStr   = doctor.workingHours && doctor.workingHours.end;
    if (!isValidTime(startStr) || !isValidTime(endStr)) return [];

    const startMins = toMinutes(startStr);
    const endMins   = toMinutes(endStr);
    if (endMins <= startMins) return [];

    // 4. Validate duration
    const dur = doctor.slotDurationMinutes;
    if (!Number.isInteger(dur) || dur < 5 || dur > 240) return [];

    // 5. Break time logic
    const bStartStr = doctor.breakTime && doctor.breakTime.start;
    const bEndStr = doctor.breakTime && doctor.breakTime.end;
    let bStartMins = -1;
    let bEndMins = -1;
    if (isValidTime(bStartStr) && isValidTime(bEndStr)) {
      bStartMins = toMinutes(bStartStr);
      bEndMins = toMinutes(bEndStr);
      if (bEndMins <= bStartMins) {
        bStartMins = -1; // invalid, ignore break
      }
    }

    // 6. Split window into full consecutive slots
    const slots = [];
    let cur = startMins;
    while (cur + dur <= endMins) {
      const slotStart = cur;
      const slotEnd = cur + dur;
      
      let overlapsBreak = false;
      if (bStartMins !== -1) {
        if (slotStart < bEndMins && bStartMins < slotEnd) {
          overlapsBreak = true;
        }
      }

      if (!overlapsBreak) {
        const h  = Math.floor(slotStart / 60);
        const m  = slotStart % 60;
        const eh = Math.floor(slotEnd / 60);
        const em = slotEnd % 60;
        slots.push({
          startTime: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
          endTime:   `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`,
        });
      }
      cur += dur;
    }
    return slots;
  } catch (_) {
    return [];
  }
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Create time slots for a doctor by splitting a time window.
 *
 * @param {string} doctorId - Doctor document _id.
 * @param {object} input - { date, startTime, endTime, slotDurationMinutes }
 * @returns {Promise<object[]>} Created slots in own-slot format.
 */
async function createSlots(doctorId, input) {
  const { date, startTime, endTime, slotDurationMinutes } = input;

  // ── Validate date ──
  if (!date) throw httpError(400, "Date is required.");
  const parsedDate = parseIsoDate(date);
  if (!parsedDate) throw httpError(400, "Invalid date format. Use YYYY-MM-DD.");

  const today = todayIso();
  if (date < today) throw httpError(400, "Cannot create slots for a past date.");

  // ── Validate times ──
  if (!startTime || !isValidTime(startTime)) {
    throw httpError(400, "Start time is required and must be in HH:mm format (00:00–23:59).");
  }
  if (!endTime || !isValidTime(endTime)) {
    throw httpError(400, "End time is required and must be in HH:mm format (00:00–23:59).");
  }

  const startMins = toMinutes(startTime);
  const endMins = toMinutes(endTime);

  if (endMins <= startMins) {
    throw httpError(400, "End time must be after start time.");
  }

  // For today, start time must be later than now
  if (date === today && startMins <= nowMinutes()) {
    throw httpError(400, "Start time must be later than the current time for today.");
  }

  // ── Validate duration ──
  if (!ALLOWED_DURATIONS.includes(slotDurationMinutes)) {
    throw httpError(400, `Slot duration must be one of: ${ALLOWED_DURATIONS.join(", ")} minutes.`);
  }

  // ── Generate slot windows ──
  const newSlots = [];
  for (let t = startMins; t + slotDurationMinutes <= endMins; t += slotDurationMinutes) {
    const h1 = Math.floor(t / 60);
    const m1 = t % 60;
    const e = t + slotDurationMinutes;
    const h2 = Math.floor(e / 60);
    const m2 = e % 60;

    newSlots.push({
      startTime: `${String(h1).padStart(2, "0")}:${String(m1).padStart(2, "0")}`,
      endTime: `${String(h2).padStart(2, "0")}:${String(m2).padStart(2, "0")}`,
    });
  }

  if (newSlots.length === 0) {
    throw httpError(400, "The time window is too short for the chosen slot duration.");
  }

  if (newSlots.length > MAX_SLOTS_PER_REQUEST) {
    throw httpError(400, `Cannot create more than ${MAX_SLOTS_PER_REQUEST} slots in a single request.`);
  }

  // ── Overlap check against existing slots on the same date ──
  const { dayStart, dayEnd } = dayRange(parsedDate);
  const existing = await Slot.find({
    doctor: doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
  }).select("startTime endTime");

  for (const ns of newSlots) {
    const nsStart = toMinutes(ns.startTime);
    const nsEnd = toMinutes(ns.endTime);

    for (const es of existing) {
      const esStart = toMinutes(es.startTime);
      const esEnd = toMinutes(es.endTime);

      if (rangesOverlap(nsStart, nsEnd, esStart, esEnd)) {
        throw httpError(
          409,
          `Time slot ${toDisplayTime(nsStart)}–${toDisplayTime(nsEnd)} overlaps with an existing slot (${toDisplayTime(esStart)}–${toDisplayTime(esEnd)}).`
        );
      }
    }
  }

  // ── Batch insert ──
  const docs = newSlots.map((s) => ({
    doctor: doctorId,
    date: parsedDate,
    startTime: s.startTime,
    endTime: s.endTime,
    isManual: true,
  }));

  const created = await Slot.insertMany(docs);

  // All newly created slots are unbooked
  return created.map((s) => formatOwnSlot(s, false));
}

/**
 * List a doctor's own slots within a date range, with booking status.
 *
 * @param {string} doctorId - Doctor document _id.
 * @param {object} options - { from?, to? } as "YYYY-MM-DD" strings.
 * @returns {Promise<object[]>} Slots in own-slot format.
 */
async function listOwnSlots(doctorId, { from, to } = {}) {
  const today = todayIso();
  const fromDate = from || today;
  const toDate = to || addDays(fromDate, 30);

  const parsedFrom = parseIsoDate(fromDate);
  const parsedTo = parseIsoDate(toDate);

  if (!parsedFrom) throw httpError(400, "Invalid 'from' date format. Use YYYY-MM-DD.");
  if (!parsedTo) throw httpError(400, "Invalid 'to' date format. Use YYYY-MM-DD.");

  // Check range not exceeding 62 days
  const diffMs = parsedTo.getTime() - parsedFrom.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 62) throw httpError(400, "Date range cannot exceed 62 days.");

  const { dayStart } = dayRange(parsedFrom);
  const { dayEnd } = dayRange(parsedTo);

  const slots = await Slot.find({
    doctor: doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
  }).sort({ date: 1, startTime: 1 });

  if (slots.length === 0) return [];

  // Single appointment query for the entire range
  const bookedSet = await bookedLabelsInRange(doctorId, dayStart, dayEnd);

  return slots.map((s) => {
    const key = toIsoDate(s.date) + "|" + slotLabel(s);
    return formatOwnSlot(s, bookedSet.has(key));
  });
}

/**
 * Update a single slot belonging to a doctor.
 *
 * @param {string} doctorId - Doctor document _id.
 * @param {string} slotId - Slot document _id.
 * @param {object} changes - Any subset of { date, startTime, endTime }.
 * @returns {Promise<object>} Updated slot in own-slot format.
 */
async function updateSlot(doctorId, slotId, changes) {
  if (!mongoose.Types.ObjectId.isValid(slotId)) {
    throw httpError(404, "Time slot not found.");
  }

  const slot = await Slot.findOne({ _id: slotId, doctor: doctorId });
  if (!slot) throw httpError(404, "Time slot not found.");

  // ── Check if booked ──
  const currentLabel = slotLabel(slot);
  const { dayStart, dayEnd } = dayRange(slot.date);

  const bookedAppt = await Appointment.findOne({
    doctor: doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
    timeSlot: currentLabel,
    status: { $in: ['upcoming', 'scheduled', 'confirmed'] },
  });

  if (bookedAppt) {
    if (changes.status === "cancelled") {
      throw httpError(409, "This time already has a booked appointment, so it can't be cancelled.");
    }
    if (changes.date !== undefined || changes.startTime !== undefined || changes.endTime !== undefined) {
      throw httpError(409, "This time already has a booked appointment, so it can't be changed.");
    }
  }

  // ── Status only fast path ──
  const isTimeChange = changes.date !== undefined || changes.startTime !== undefined || changes.endTime !== undefined;
  if (!isTimeChange && changes.status !== undefined) {
    if (changes.status === "open") {
      const today = todayIso();
      const slotDateIso = toIsoDate(slot.date);
      if (slotDateIso < today) throw httpError(400, "Cannot create slots for a past date.");
      if (slotDateIso === today && toMinutes(slot.startTime) <= nowMinutes()) {
        throw httpError(400, "Start time must be later than the current time for today.");
      }
    }
    slot.status = changes.status;
    slot.isManual = true;
    await slot.save();
    return formatOwnSlot(slot, Boolean(bookedAppt));
  }

  // ── Apply time changes ──
  let newDate = slot.date;
  let newStartTime = slot.startTime;
  let newEndTime = slot.endTime;

  if (changes.status !== undefined) {
    slot.status = changes.status;
  }
  slot.isManual = true;

  if (changes.date !== undefined) {
    const parsed = parseIsoDate(changes.date);
    if (!parsed) throw httpError(400, "Invalid date format. Use YYYY-MM-DD.");

    const today = todayIso();
    if (changes.date < today) throw httpError(400, "Cannot move a slot to a past date.");

    newDate = parsed;
  }

  if (changes.startTime !== undefined) {
    if (!isValidTime(changes.startTime)) {
      throw httpError(400, "Start time must be in HH:mm format (00:00–23:59).");
    }
    newStartTime = changes.startTime;
  }

  if (changes.endTime !== undefined) {
    if (!isValidTime(changes.endTime)) {
      throw httpError(400, "End time must be in HH:mm format (00:00–23:59).");
    }
    newEndTime = changes.endTime;
  }

  const newStartMins = toMinutes(newStartTime);
  const newEndMins = toMinutes(newEndTime);

  if (newEndMins <= newStartMins) {
    throw httpError(400, "End time must be after start time.");
  }

  // For today, start time must be later than now
  const today = todayIso();
  const newDateIso = toIsoDate(newDate);
  if (newDateIso === today && newStartMins <= nowMinutes()) {
    throw httpError(400, "Start time must be later than the current time for today.");
  }

  // ── Overlap check (exclude self) ──
  const targetDay = dayRange(newDate);
  const existing = await Slot.find({
    doctor: doctorId,
    date: { $gte: targetDay.dayStart, $lte: targetDay.dayEnd },
    _id: { $ne: slot._id },
  }).select("startTime endTime");

  for (const es of existing) {
    if (rangesOverlap(newStartMins, newEndMins, toMinutes(es.startTime), toMinutes(es.endTime))) {
      throw httpError(409, "This time overlaps with another slot on the same date.");
    }
  }

  slot.date = newDate;
  slot.startTime = newStartTime;
  slot.endTime = newEndTime;
  await slot.save();

  // Determine booking status for the updated slot
  const updatedLabel = slotLabel(slot);
  const updatedDay = dayRange(slot.date);
  const isBooked = await Appointment.findOne({
    doctor: doctorId,
    date: { $gte: updatedDay.dayStart, $lte: updatedDay.dayEnd },
    timeSlot: updatedLabel,
    status: { $in: ['upcoming', 'scheduled', 'confirmed'] },
  });

  return formatOwnSlot(slot, Boolean(isBooked));
}

/**
 * Delete a single slot belonging to a doctor.
 *
 * @param {string} doctorId - Doctor document _id.
 * @param {string} slotId - Slot document _id.
 */
async function deleteSlot(doctorId, slotId) {
  if (!mongoose.Types.ObjectId.isValid(slotId)) {
    throw httpError(404, "Time slot not found.");
  }

  const slot = await Slot.findOne({ _id: slotId, doctor: doctorId });
  if (!slot) throw httpError(404, "Time slot not found.");

  // ── Check if booked ──
  const label = slotLabel(slot);
  const { dayStart, dayEnd } = dayRange(slot.date);

  const bookedAppt = await Appointment.findOne({
    doctor: doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
    timeSlot: label,
    status: { $in: ['upcoming', 'scheduled', 'confirmed'] },
  });

  if (bookedAppt) {
    throw httpError(409, "This time already has a booked appointment, so it can't be changed.");
  }

  await Slot.deleteOne({ _id: slot._id });
}

/**
 * Get available time-slot labels for a doctor on a specific date.
 * Returns only unbooked labels in chronological order.
 * For today, excludes slots whose start time has already passed.
 *
 * @param {string} doctorId - Doctor document _id (will be validated).
 * @param {string} isoDate - Date in "YYYY-MM-DD" format.
 * @returns {Promise<string[]>} Array of label strings, e.g. ["9:00 AM", "9:30 AM"].
 */
async function getAvailableLabelsForDate(doctorId, isoDate) {
  const doctor = await requireDoctor(doctorId);

  const parsedDate = parseIsoDate(isoDate);
  if (!parsedDate) throw httpError(400, "Invalid date format. Use YYYY-MM-DD.");

  const today = todayIso();

  // Dates before today → no slots
  if (isoDate < today) return [];

  const { dayStart, dayEnd } = dayRange(parsedDate);
  const isToday = isoDate === today;
  const currentMins = isToday ? nowMinutes() : -1;

  // Mode: if any stored Slot exists for this doctor, use stored-slot path.
  const hasStoredSlots = await Slot.exists({ doctor: doctorId });

  if (hasStoredSlots) {
    // ── Stored-slot mode (original behaviour) ──
    const slots = await Slot.find({
      doctor: doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: "cancelled" },
    }).sort({ startTime: 1 });

    if (slots.length === 0) return [];

    const bookedSet = await bookedLabelsInRange(doctorId, dayStart, dayEnd);
    const available = [];
    for (const s of slots) {
      if (isToday && toMinutes(s.startTime) <= currentMins) continue;
      const label = slotLabel(s);
      const key = toIsoDate(s.date) + "|" + label;
      if (!bookedSet.has(key)) available.push(label);
    }
    return available;
  }

  // ── Legacy mode: generate from working-hours pattern ──
  const generated = buildDaySlots(doctor, isoDate);
  if (generated.length === 0) return [];

  const bookedSet = await bookedLabelsInRange(doctorId, dayStart, dayEnd);
  const available = [];
  for (const s of generated) {
    if (isToday && toMinutes(s.startTime) <= currentMins) continue;
    const label = toDisplayTime(toMinutes(s.startTime));
    const key = isoDate + "|" + label;
    if (!bookedSet.has(key)) available.push(label);
  }
  return available;
}

/**
 * Get availability over a date range for a doctor (patient-facing).
 * Returns only dates with at least one available slot.
 *
 * @param {string} doctorId - Doctor document _id (will be validated).
 * @param {object} options - { from?, to? } as "YYYY-MM-DD" strings.
 * @returns {Promise<object[]>} Array of { date, slots: [{ id, startTime, endTime, label }] }.
 */
async function getAvailabilityRange(doctorId, { from, to } = {}) {
  const doctor = await requireDoctor(doctorId);

  const today = todayIso();

  // Default and clamp 'from' to today
  let fromDate = from || today;
  if (fromDate < today) fromDate = today;

  // Default 'to' = from + 13 days
  const toDate = to || addDays(fromDate, 13);

  const parsedFrom = parseIsoDate(fromDate);
  const parsedTo = parseIsoDate(toDate);

  if (!parsedFrom) throw httpError(400, "Invalid 'from' date format. Use YYYY-MM-DD.");
  if (!parsedTo) throw httpError(400, "Invalid 'to' date format. Use YYYY-MM-DD.");

  // Max range 31 days
  const diffMs = parsedTo.getTime() - parsedFrom.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 31) throw httpError(400, "Date range cannot exceed 31 days.");

  const { dayStart } = dayRange(parsedFrom);
  const { dayEnd } = dayRange(parsedTo);

  const currentMins = nowMinutes();
  const isToday = (dateStr) => dateStr === today;

  // Mode: if any stored Slot exists for this doctor, use stored-slot path.
  const hasStoredSlots = await Slot.exists({ doctor: doctorId });

  if (hasStoredSlots) {
    // ── Stored-slot mode (original behaviour) ──
    const slots = await Slot.find({
      doctor: doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: "cancelled" },
    }).sort({ date: 1, startTime: 1 });

    if (slots.length === 0) return [];

    const bookedSet = await bookedLabelsInRange(doctorId, dayStart, dayEnd);
    const dateMap = new Map();

    for (const s of slots) {
      const dateStr = toIsoDate(s.date);
      if (isToday(dateStr) && toMinutes(s.startTime) <= currentMins) continue;
      const label = slotLabel(s);
      const key = dateStr + "|" + label;
      if (bookedSet.has(key)) continue;
      if (!dateMap.has(dateStr)) dateMap.set(dateStr, []);
      dateMap.get(dateStr).push(formatAvailabilitySlot(s));
    }

    const result = [];
    for (const [dateStr, slotArr] of dateMap) {
      result.push({ date: dateStr, slots: slotArr });
    }
    return result;
  }

  // ── Legacy mode: generate from working-hours pattern ──
  // Single appointment query for the whole range
  const bookedSet = await bookedLabelsInRange(doctorId, dayStart, dayEnd);
  const dateMap = new Map();

  let cursor = fromDate;
  while (cursor <= toDate) {
    const generated = buildDaySlots(doctor, cursor);
    if (generated.length > 0) {
      const available = [];
      for (const s of generated) {
        if (isToday(cursor) && toMinutes(s.startTime) <= currentMins) continue;
        const label = toDisplayTime(toMinutes(s.startTime));
        const key = cursor + "|" + label;
        if (bookedSet.has(key)) continue;
        available.push({
          id: `legacy-${cursor}-${s.startTime}`,
          startTime: s.startTime,
          endTime: s.endTime,
          label,
        });
      }
      if (available.length > 0) dateMap.set(cursor, available);
    }
    cursor = addDays(cursor, 1);
  }

  const result = [];
  for (const [dateStr, slotArr] of dateMap) {
    result.push({ date: dateStr, slots: slotArr });
  }
  return result;
}

/**
 * Generate and persist slots for the next 30 days from the doctor's working-hours pattern.
 * Safe to re-run: skips overlapping existing slots and ignores duplicate-key errors.
 *
 * @param {string} doctorId - Doctor document _id.
 * @returns {Promise<{ created: number, skipped: number }>}
 */
async function generateSlotsFromWorkingHours(doctorId) {
  const doctor = await requireDoctor(doctorId);

  const today = todayIso();
  const rangeTo = addDays(today, 29);
  const currentMins = nowMinutes();

  // Collect all generated {date, startTime, endTime} across the 30-day window.
  const candidates = [];
  let cursor = today;
  while (cursor <= rangeTo) {
    const daySlots = buildDaySlots(doctor, cursor);
    for (const s of daySlots) {
      // For today, drop slots whose start has already passed.
      if (cursor === today && toMinutes(s.startTime) <= currentMins) continue;
      candidates.push({ date: cursor, startTime: s.startTime, endTime: s.endTime });
    }
    cursor = addDays(cursor, 1);
  }

  if (candidates.length === 0) {
    throw httpError(
      400,
      "Your working hours aren't set up correctly. Please contact an administrator."
    );
  }

  // Fetch existing slots for the range in a single query.
  const { dayStart } = dayRange(parseIsoDate(today));
  const { dayEnd }   = dayRange(parseIsoDate(rangeTo));
  const existing = await Slot.find({
    doctor: doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
  }).select("startTime endTime date");

  // Build pairs for overlap detection.
  const existingPairs = existing.map((s) => ({
    dateStr: toIsoDate(s.date),
    startMins: toMinutes(s.startTime),
    endMins:   toMinutes(s.endTime),
  }));

  // Filter candidates to those that do not overlap any existing slot on the same date.
  const toInsert = candidates.filter((c) => {
    const cStart = toMinutes(c.startTime);
    const cEnd   = toMinutes(c.endTime);
    return !existingPairs.some(
      (e) => e.dateStr === c.date && rangesOverlap(cStart, cEnd, e.startMins, e.endMins)
    );
  });

  const skipped = candidates.length - toInsert.length;

  if (toInsert.length === 0) return { created: 0, skipped };

  // Build Slot documents.
  const docs = toInsert.map((c) => ({
    doctor: doctorId,
    date: parseIsoDate(c.date),
    startTime: c.startTime,
    endTime: c.endTime,
  }));

  let created = 0;
  try {
    const result = await Slot.insertMany(docs, { ordered: false });
    created = result.length;
  } catch (err) {
    // ordered:false — partial success; count inserted docs, ignore duplicate-key errors.
    if (err.insertedDocs) created = err.insertedDocs.length;
    else if (err.insertedCount !== undefined) created = err.insertedCount;
    // Any other error rethrow.
    else if (!err.writeErrors && !err.code) throw err;
  }

  return { created, skipped: candidates.length - created };
}

/**
 * Cancel a whole day of slots.
 */
async function cancelDay(doctorId, isoDate) {
  const parsedDate = parseIsoDate(isoDate);
  if (!parsedDate) throw httpError(400, "Invalid date format. Use YYYY-MM-DD.");

  const { dayStart, dayEnd } = dayRange(parsedDate);
  
  const today = todayIso();
  const isPastDay = isoDate < today;
  if (isPastDay) {
     throw httpError(400, "Cannot cancel a past date.");
  }

  const slots = await Slot.find({
    doctor: doctorId,
    date: { $gte: dayStart, $lte: dayEnd },
    status: "open",
  });

  const isToday = isoDate === today;
  const currentMins = nowMinutes();

  let cancelled = 0;
  let keptBooked = 0;

  for (const slot of slots) {
    if (isToday && toMinutes(slot.startTime) <= currentMins) {
      continue;
    }

    const label = slotLabel(slot);
    const isBooked = await Appointment.findOne({
      doctor: doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      timeSlot: label,
      status: { $in: ['upcoming', 'scheduled', 'confirmed'] },
    });

    if (isBooked) {
      keptBooked++;
    } else {
      slot.status = "cancelled";
      slot.isManual = true;
      await slot.save();
      cancelled++;
    }
  }

  return {
    cancelled,
    keptBooked,
    message: `Cancelled ${cancelled} slot(s). ${keptBooked ? `Kept ${keptBooked} booked slot(s).` : ''}`.trim()
  };
}

/**
 * Get doctor schedule settings.
 */
async function getSchedule(doctorId) {
  const doctor = await requireDoctor(doctorId);
  return {
    workingDays: doctor.workingDays || [],
    workingHours: doctor.workingHours || { start: "", end: "" },
    slotDurationMinutes: doctor.slotDurationMinutes || 30,
    breakTime: doctor.breakTime || { start: "", end: "" },
  };
}

/**
 * Update schedule settings and rebuild upcoming slots.
 */
async function updateSchedule(doctorId, input) {
  const doctor = await requireDoctor(doctorId);
  const { workingDays, workingHours, slotDurationMinutes, breakTime } = input;

  if (!Array.isArray(workingDays) || workingDays.length === 0 || new Set(workingDays).size !== workingDays.length || workingDays.some(d => d < 0 || d > 6)) {
    throw httpError(400, "Select at least one working day.");
  }

  if (!workingHours || !isValidTime(workingHours.start) || !isValidTime(workingHours.end) || toMinutes(workingHours.end) <= toMinutes(workingHours.start)) {
    throw httpError(400, "End time must be after start time.");
  }

  if (![15, 20, 30, 45, 60].includes(slotDurationMinutes)) {
    throw httpError(400, "Choose a slot length of 15, 20, 30, 45 or 60 minutes.");
  }

  let validBreak = { start: "", end: "" };
  if (breakTime && (breakTime.start || breakTime.end)) {
    if (!isValidTime(breakTime.start) || !isValidTime(breakTime.end) || toMinutes(breakTime.end) <= toMinutes(breakTime.start)) {
      throw httpError(400, "Your break must fall within your working hours.");
    }
    const bStart = toMinutes(breakTime.start);
    const bEnd = toMinutes(breakTime.end);
    const wStart = toMinutes(workingHours.start);
    const wEnd = toMinutes(workingHours.end);
    if (bStart < wStart || bEnd > wEnd) {
      throw httpError(400, "Your break must fall within your working hours.");
    }
    validBreak = { start: breakTime.start, end: breakTime.end };
  }

  doctor.workingDays = workingDays;
  doctor.workingHours = { start: workingHours.start, end: workingHours.end };
  doctor.slotDurationMinutes = slotDurationMinutes;
  doctor.breakTime = validBreak;
  await doctor.save();

  const todayDate = parseIsoDate(todayIso());
  const futureSlots = await Slot.find({
    doctor: doctor._id,
    date: { $gte: todayDate },
    isManual: { $ne: true }
  });

  let removed = 0;
  for (const slot of futureSlots) {
    const label = slotLabel(slot);
    const { dayStart, dayEnd } = dayRange(slot.date);
    const isBooked = await Appointment.findOne({
      doctor: doctor._id,
      date: { $gte: dayStart, $lte: dayEnd },
      timeSlot: label,
      status: { $in: ['upcoming', 'scheduled', 'confirmed'] }
    });

    if (!isBooked) {
      await Slot.deleteOne({ _id: slot._id });
      removed++;
    }
  }

  let created = 0;
  try {
    const result = await generateSlotsFromWorkingHours(doctor._id);
    created = result.created;
  } catch (err) {
    if (err.status === 400) {
      created = 0;
    } else {
      throw err;
    }
  }

  return {
    schedule: await getSchedule(doctor._id),
    removed,
    created,
    message: "Schedule updated. Your upcoming open times have been rebuilt; booked times were kept."
  };
}

module.exports = {
  createSlots,
  listOwnSlots,
  updateSlot,
  deleteSlot,
  getAvailableLabelsForDate,
  getAvailabilityRange,
  generateSlotsFromWorkingHours,
  cancelDay,
  getSchedule,
  updateSchedule,
  buildDaySlots,
};
