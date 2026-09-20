/**
 * Date utility functions for the patient-facing doctor browsing and schedule views.
 * Prompt 04 also imports these exports — keep them stable.
 */

/**
 * Return today's date as a "YYYY-MM-DD" string in the browser's local timezone.
 * @returns {string}
 */
export function getTodayIso() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse a "YYYY-MM-DD" string into local year/month/day parts and format as a
 * long display date, e.g. "Mon, Sep 21, 2026".
 *
 * Uses local parts explicitly (not new Date("YYYY-MM-DD"), which UTC-parses
 * and can shift the day in negative-UTC-offset timezones).
 *
 * @param {string} isoDate - Date in "YYYY-MM-DD" format.
 * @returns {string} Formatted date string.
 */
export function formatDisplayDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Parse a "YYYY-MM-DD" string and format as a short date tab label,
 * e.g. "Mon 21 Sep".
 *
 * @param {string} isoDate - Date in "YYYY-MM-DD" format.
 * @returns {string} Short formatted date string.
 */
export function formatShortDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${weekday} ${d} ${month}`;
}
