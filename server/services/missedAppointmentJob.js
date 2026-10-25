/**
 * Background job: mark past "scheduled" appointments as "missed".
 *
 * An appointment is considered missed when its slot has ended (plus a short
 * grace period), its status is still "scheduled", and no Consultation has
 * been started or completed for it.
 *
 * Safety rules:
 *   - Appointments that already have a consultation are never swept, so a
 *     doctor who is seeing the patient is not affected.
 *   - Same-day appointments get a grace period after the slot ends, because a
 *     doctor can start a consultation late.
 *   - Every write is conditional on status "scheduled", so an appointment
 *     that was completed or cancelled in the meantime is never overwritten.
 *   - If a consultation is started between the check and the write, the
 *     appointment is put back to "scheduled".
 *
 * The job runs once on server startup and then every 15 minutes.
 */

const Appointment = require('../models/Appointment');
const Consultation = require('../models/Consultation');

/** Slot length used when the doctor has none configured. */
const DEFAULT_SLOT_MINUTES = 30;

/** Extra time after a same-day slot ends before it is flagged as missed. */
const GRACE_MINUTES = 30;

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
 * Keep only the appointment ids that have no consultation.
 *
 * @param {Array} ids - Appointment ids.
 * @returns {Promise<Array>} Ids without a consultation.
 */
async function withoutConsultation(ids) {
  if (ids.length === 0) return [];

  const consulted = await Consultation.distinct('appointment', {
    appointment: { $in: ids },
  });
  const consultedSet = new Set(consulted.map(String));

  return ids.filter((id) => !consultedSet.has(String(id)));
}

/**
 * Put back any just-marked appointment that has a consultation by now.
 * Covers a consultation started between the check and the write.
 *
 * @param {Array} ids - Appointment ids that were just marked missed.
 * @returns {Promise<number>} Number of appointments restored.
 */
async function restoreConsulted(ids) {
  const consulted = await Consultation.distinct('appointment', {
    appointment: { $in: ids },
  });
  if (consulted.length === 0) return 0;

  const result = await Appointment.updateMany(
    { _id: { $in: consulted }, status: 'missed' },
    { $set: { status: 'scheduled' } },
  );
  return result.modifiedCount || 0;
}

/**
 * Mark the given appointments as missed, only if they are still "scheduled".
 *
 * @param {Array} ids - Candidate appointment ids.
 * @returns {Promise<number>} Number of appointments left marked as missed.
 */
async function markMissed(ids) {
  const candidates = await withoutConsultation(ids);
  if (candidates.length === 0) return 0;

  const result = await Appointment.updateMany(
    { _id: { $in: candidates }, status: 'scheduled' },
    { $set: { status: 'missed' } },
  );
  const marked = result.modifiedCount || 0;
  if (marked === 0) return 0;

  return marked - (await restoreConsulted(candidates));
}

/**
 * Sweep "scheduled" appointments whose slot has passed and mark them missed.
 *
 *   1. Everything on an earlier calendar day than the clinic's today.
 *   2. Today's appointments whose slot (start + the doctor's slot length)
 *      ended more than GRACE_MINUTES ago.
 *
 * Respects process.env.CLINIC_TZ_OFFSET for the clinic's local day and time.
 *
 * @returns {Promise<number>} Total number of appointments marked as missed.
 */
async function sweepMissedAppointments() {
  const tzOffsetMinutes = parseTimezoneOffsetMinutes(process.env.CLINIC_TZ_OFFSET);
  const clinicNow = new Date(Date.now() + tzOffsetMinutes * 60 * 1000);

  const year = clinicNow.getUTCFullYear();
  const month = clinicNow.getUTCMonth();
  const day = clinicNow.getUTCDate();

  // Appointment dates are stored at UTC midnight of the calendar date.
  const todayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  const nowMinutes = clinicNow.getUTCHours() * 60 + clinicNow.getUTCMinutes();

  // Step 1: earlier days
  const earlier = await Appointment.find({
    status: 'scheduled',
    date: { $lt: todayStart },
  }).select('_id').lean();

  let marked = await markMissed(earlier.map((apt) => apt._id));

  // Step 2: today, slot by slot
  const today = await Appointment.find({
    status: 'scheduled',
    date: { $gte: todayStart, $lte: todayEnd },
  })
    .select('_id timeSlot doctor')
    .populate('doctor', 'slotDurationMinutes')
    .lean();

  const overdue = [];
  for (const apt of today) {
    const start = parseDisplayTime(apt.timeSlot);
    if (start === null) continue; // unparseable label: leave it alone

    const length = apt.doctor?.slotDurationMinutes || DEFAULT_SLOT_MINUTES;
    if (nowMinutes >= start + length + GRACE_MINUTES) {
      overdue.push(apt._id);
    }
  }

  marked += await markMissed(overdue);

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
