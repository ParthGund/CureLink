/**
 * Background job: mark past "scheduled" appointments as "missed".
 *
 * An appointment is considered missed when its date + timeSlot end time
 * has already passed, its status is still "scheduled", and no Consultation
 * has been started or completed for it.
 *
 * The job runs once on server startup and then on a configurable interval
 * (default: every 15 minutes).
 */

const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');

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
 * Parse CLINIC_TZ_OFFSET into total offset minutes from UTC.
 * Supports:
 *   - ISO format: "+05:30", "-04:00", "+00:00"
 *   - Minutes: "330", "-300"
 *   - Hours: "5.5", "+5.5", "-5", "5"
 * Safe fallback: 0 (UTC).
 *
 * @param {string|undefined} val
 * @returns {number} Offset in minutes from UTC.
 */
function parseTimezoneOffsetMinutes(val) {
  if (!val || typeof val !== 'string') return 0;
  const s = val.trim();
  if (!s) return 0;

  // Check +/-HH:MM format
  const colonMatch = s.match(/^([+-])?(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const sign = colonMatch[1] === '-' ? -1 : 1;
    const hours = parseInt(colonMatch[2], 10);
    const mins = parseInt(colonMatch[3], 10);
    return sign * (hours * 60 + mins);
  }

  const num = Number(s);
  if (isNaN(num)) return 0;

  // Absolute magnitude <= 14 indicates offset in hours (e.g. 5.5, -4, 5)
  if (Math.abs(num) <= 14) {
    return Math.round(num * 60);
  }
  return Math.round(num);
}

/**
 * Sweep all "scheduled" appointments whose slot time has passed and
 * bulk-update them to "missed", skipping any appointment with an existing Consultation.
 *
 * Respects process.env.CLINIC_TZ_OFFSET for local calendar day and time calculations.
 *
 * @returns {number} Total number of appointments marked as missed.
 */
async function sweepMissedAppointments() {
  // Query all appointments that already have an associated consultation
  const consultedAptIds = await Consultation.distinct('appointment');
  const notConsultedFilter =
    consultedAptIds && consultedAptIds.length > 0
      ? { _id: { $nin: consultedAptIds } }
      : {};

  // Timezone calculation
  const tzOffsetMinutes = parseTimezoneOffsetMinutes(process.env.CLINIC_TZ_OFFSET);
  const tzOffsetMs = tzOffsetMinutes * 60 * 1000;

  const nowUtc = new Date();
  const clinicNow = new Date(nowUtc.getTime() + tzOffsetMs);

  const clinicYear = clinicNow.getUTCFullYear();
  const clinicMonth = clinicNow.getUTCMonth();
  const clinicDate = clinicNow.getUTCDate();

  // In the DB, appointment dates are stored at UTC midnight of the calendar date
  const clinicTodayUtcDate = new Date(Date.UTC(clinicYear, clinicMonth, clinicDate, 0, 0, 0, 0));
  const clinicTodayEndUtcDate = new Date(Date.UTC(clinicYear, clinicMonth, clinicDate, 23, 59, 59, 999));

  // Current minutes since midnight in the clinic's local timezone
  const clinicNowMinutes = clinicNow.getUTCHours() * 60 + clinicNow.getUTCMinutes();

  // ── Step 1: Bulk-mark scheduled appointments before today at the clinic ──
  const bulkResult = await Appointment.updateMany(
    {
      status: 'scheduled',
      date: { $lt: clinicTodayUtcDate },
      ...notConsultedFilter,
    },
    { $set: { status: 'missed' } },
  );

  let marked = bulkResult.modifiedCount || 0;

  // ── Step 2: Check today's scheduled appointments slot-by-slot ─────────────
  const todayScheduled = await Appointment.find({
    status: 'scheduled',
    date: { $gte: clinicTodayUtcDate, $lte: clinicTodayEndUtcDate },
    ...notConsultedFilter,
  });

  const idsToMark = [];

  for (const apt of todayScheduled) {
    const slotMinutes = parseDisplayTime(apt.timeSlot);
    if (slotMinutes === null) continue;

    // Consider a 30-minute slot duration as the default window.
    // The appointment is missed once the slot's end time has passed.
    const slotEnd = slotMinutes + 30;

    if (clinicNowMinutes >= slotEnd) {
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
  let timer = null;
  let stopped = false;
  let activeRun = null;
  const run = () => {
    if (stopped || activeRun) return activeRun;
    activeRun = (async () => {
      try {
        const n = await sweepMissedAppointments();
        if (n > 0) console.log(`[missed-sweep] Marked ${n} appointment(s) as missed.`);
      } catch (err) {
        console.error('[missed-sweep] Error:', err.message);
      } finally {
        activeRun = null;
        if (!stopped) {
          timer = setTimeout(run, intervalMs);
          if (timer.unref) timer.unref();
        }
      }
    })();
    return activeRun;
  };
  // Run immediately, then schedule the next sweep only after this one finishes.
  run();

  return {
    stop: async () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (activeRun) await activeRun;
    },
  };
}

module.exports = { sweepMissedAppointments, startMissedAppointmentJob, parseTimezoneOffsetMinutes };
