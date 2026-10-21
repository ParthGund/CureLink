/**
 * Background job: mark past "scheduled" appointments as "missed".
 *
 * An appointment is considered missed when its date + timeSlot end time
 * has already passed and its status is still "scheduled".
 *
 * The job runs once on server startup and then on a configurable interval
 * (default: every 15 minutes).
 */

const Appointment = require('../models/Appointment');

/**
 * Parse a 12-hour display label ("9:00 AM", "12:30 PM") back to
 * total minutes since midnight.
 *
 * @param {string} label - Display time, e.g. "9:00 AM".
 * @returns {number|null} Minutes since midnight, or null if unparseable.
 */
function parseDisplayTime(label) {
  if (typeof label !== 'string') return null;
  const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;

  return h * 60 + m;
}

/**
 * Sweep all "scheduled" appointments whose slot time has passed and
 * bulk-update them to "missed".
 *
 * Strategy:
 *   1. Find every appointment with status "scheduled" whose **date** is
 *      before today (clearly in the past).
 *   2. Find every appointment with status "scheduled" whose **date** is
 *      today but whose timeSlot end time is before the current UTC time.
 *
 * Step 1 is a single bulk write; step 2 requires per-document evaluation
 * because the timeSlot is a display label, not a machine timestamp.
 *
 * @returns {number} Total number of appointments marked as missed.
 */
async function sweepMissedAppointments() {
  const now = new Date();

  // UTC midnight of today
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // ── Step 1: bulk-mark everything before today ────────────────
  const bulkResult = await Appointment.updateMany(
    {
      status: 'scheduled',
      date: { $lt: todayStart },
    },
    { $set: { status: 'missed' } },
  );

  let marked = bulkResult.modifiedCount || 0;

  // ── Step 2: check today's appointments slot-by-slot ──────────
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCHours(23, 59, 59, 999);

  const todayScheduled = await Appointment.find({
    status: 'scheduled',
    date: { $gte: todayStart, $lte: todayEnd },
  });

  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const idsToMark = [];

  for (const apt of todayScheduled) {
    const slotMinutes = parseDisplayTime(apt.timeSlot);
    // If the slot time is unparseable, skip it (don't silently corrupt data).
    if (slotMinutes === null) continue;

    // Consider a 30-minute slot duration as the default window.
    // The appointment is missed once the slot's end time has passed.
    const slotEnd = slotMinutes + 30;

    if (nowMinutes >= slotEnd) {
      idsToMark.push(apt._id);
    }
  }

  if (idsToMark.length > 0) {
    const result = await Appointment.updateMany(
      { _id: { $in: idsToMark } },
      { $set: { status: 'missed' } },
    );
    marked += result.modifiedCount || 0;
  }

  return marked;
}

/** Default interval: 15 minutes. */
const DEFAULT_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Start the missed-appointment sweep as a repeating background job.
 *
 * @param {number} [intervalMs] - Milliseconds between sweeps.
 * @returns {{ stop: () => void }} Handle to clear the interval.
 */
function startMissedAppointmentJob(intervalMs = DEFAULT_INTERVAL_MS) {
  // Run immediately on startup, then repeat.
  sweepMissedAppointments()
    .then((n) => {
      if (n > 0) console.log(`[missed-sweep] Marked ${n} appointment(s) as missed.`);
    })
    .catch((err) => console.error('[missed-sweep] Error on initial run:', err.message));

  const handle = setInterval(() => {
    sweepMissedAppointments()
      .then((n) => {
        if (n > 0) console.log(`[missed-sweep] Marked ${n} appointment(s) as missed.`);
      })
      .catch((err) => console.error('[missed-sweep] Error:', err.message));
  }, intervalMs);

  // Allow the Node process to exit even if the interval is still active.
  if (handle.unref) handle.unref();

  return {
    stop: () => clearInterval(handle),
  };
}

module.exports = { sweepMissedAppointments, startMissedAppointmentJob };
