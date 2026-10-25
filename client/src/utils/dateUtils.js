/**
 * Date helpers shared by the patient browsing, booking and dashboard views.
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

/**
 * Convert a slot label ("9:00 AM", "12:30 pm" or "14:30") to minutes since
 * midnight. Returns -1 when the label cannot be parsed.
 *
 * @param {string} label - Slot label.
 * @returns {number} Minutes since midnight, or -1.
 */
export function slotMinutes(label) {
  if (!label) return -1;

  const twelveHour = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHour) {
    let hours = parseInt(twelveHour[1], 10);
    const minutes = parseInt(twelveHour[2], 10);
    const isPM = twelveHour[3].toUpperCase() === 'PM';
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const twentyFourHour = label.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFourHour) {
    return parseInt(twentyFourHour[1], 10) * 60 + parseInt(twentyFourHour[2], 10);
  }

  return -1;
}

const SHIFTS = [
  { key: 'morning',   label: 'Morning',   icon: '\uD83C\uDF05' }, // before 12:00
  { key: 'afternoon', label: 'Afternoon', icon: '\u2600\uFE0F' },  // 12:00 to 16:59
  { key: 'evening',   label: 'Evening',   icon: '\uD83C\uDF06' }, // 17:00 onwards
];

/**
 * Group slot labels into Morning / Afternoon / Evening and drop empty groups.
 * A label that cannot be parsed is placed in Morning.
 *
 * @param {string[]} slots - Slot labels such as "9:00 AM".
 * @returns {{ key: string, label: string, icon: string, slots: string[] }[]}
 */
export function groupByShift(slots) {
  const groups = { morning: [], afternoon: [], evening: [] };

  slots.forEach((label) => {
    const minutes = slotMinutes(label);
    if (minutes < 720) {
      groups.morning.push(label);
    } else if (minutes < 1020) {
      groups.afternoon.push(label);
    } else {
      groups.evening.push(label);
    }
  });

  return SHIFTS
    .map((shift) => ({ ...shift, slots: groups[shift.key] }))
    .filter((shift) => shift.slots.length > 0);
}
