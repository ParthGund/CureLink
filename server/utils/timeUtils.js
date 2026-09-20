/**
 * Pure time and date utility functions for the schedule system.
 * No side effects, no database access.
 */

/**
 * Convert an "HH:mm" string to total minutes since midnight.
 * @param {string} hhmm - Time in "HH:mm" format.
 * @returns {number} Total minutes.
 */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Convert total minutes since midnight to a 12-hour display label.
 * Output format: "h:mm AM/PM" with a non-padded hour.
 * Must produce identical output to the legacy toDisplayTime in doctorController.
 *
 * @param {number} mins - Minutes since midnight.
 * @returns {string} Display label, e.g. "9:00 AM", "12:30 PM".
 */
function toDisplayTime(mins) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/**
 * Validate an "HH:mm" time string (24-hour, 00:00–23:59).
 * @param {string} str - The string to validate.
 * @returns {boolean} True if valid.
 */
function isValidTime(str) {
  if (typeof str !== "string") return false;
  if (!/^\d{2}:\d{2}$/.test(str)) return false;
  const [h, m] = str.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

/**
 * Parse a "YYYY-MM-DD" string into a UTC-midnight Date.
 * Returns null for invalid formats or impossible calendar dates (e.g. Feb 31).
 *
 * @param {string} str - Date string in "YYYY-MM-DD" format.
 * @returns {Date|null} UTC-midnight Date or null.
 */
function parseIsoDate(str) {
  if (typeof str !== "string") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;

  const [y, m, d] = str.split("-").map(Number);

  // Construct a UTC date and verify it roundtrips to the same components.
  // This catches impossible dates like 2026-02-31 or 2026-13-01.
  const date = new Date(Date.UTC(y, m - 1, d));

  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return date;
}

/**
 * Format a Date as "YYYY-MM-DD" using its UTC components.
 * @param {Date} date - The date to format.
 * @returns {string} ISO date string.
 */
function toIsoDate(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Add a number of days to an ISO date string.
 * @param {string} isoDate - Date in "YYYY-MM-DD" format.
 * @param {number} n - Number of days to add (can be negative).
 * @returns {string} Resulting date in "YYYY-MM-DD" format.
 */
function addDays(isoDate, n) {
  const date = parseIsoDate(isoDate);
  date.setUTCDate(date.getUTCDate() + n);
  return toIsoDate(date);
}

module.exports = {
  toMinutes,
  toDisplayTime,
  isValidTime,
  parseIsoDate,
  toIsoDate,
  addDays,
};
