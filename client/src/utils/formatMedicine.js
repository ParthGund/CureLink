/**
 * Medicine formatting utilities for the Medical History page.
 *
 * Pure, stateless helpers — no side effects, no imports.
 */

/**
 * Build an array of sentence parts describing how to take a medicine.
 * Each part has { text, strong }.
 *
 * Example output for { dosage: '2', frequency: 'At night', durationDays: 2 }:
 *   [{ text: 'Take 2', strong: true },
 *    { text: 'at night', strong: true },
 *    { text: 'for 2 days', strong: true }]
 *
 * @param {object} med
 * @returns {{ text: string, strong: boolean }[]}
 */
export function buildSentenceParts(med) {
  const parts = [];

  if (med.dosage) {
    parts.push({ text: `Take ${med.dosage}`, strong: true });
  }

  if (med.frequency) {
    const freq = med.frequency.toLowerCase();
    parts.push({ text: freq, strong: true });
  }

  const dur = durationLabel(med);
  if (dur) {
    parts.push({ text: `for ${dur}`, strong: true });
  }

  // If no dosage was present, capitalise the first part's text
  if (!med.dosage && parts.length > 0) {
    parts[0] = { ...parts[0], text: parts[0].text.charAt(0).toUpperCase() + parts[0].text.slice(1) };
  }

  return parts;
}

/**
 * Return a human-readable duration label.
 *
 * Prefers `durationDays` (e.g. "2 days"); falls back to `duration` only
 * if the text contains at least one letter (avoids bare numbers acting as
 * unlabelled values). Returns '' when nothing meaningful is available.
 *
 * @param {object} med
 * @returns {string}
 */
export function durationLabel(med) {
  if (med.durationDays) {
    return med.durationDays === 1 ? '1 day' : `${med.durationDays} days`;
  }
  if (med.duration && /[a-zA-Z]/.test(med.duration)) {
    return med.duration;
  }
  return '';
}

/**
 * Compute how many whole days remain until `endsOn`.
 *
 * @param {Date|string} endsOn
 * @param {Date} [now]
 * @returns {number} 0 or positive integer
 */
export function daysLeft(endsOn, now = new Date()) {
  const end = new Date(endsOn);
  if (isNaN(end.getTime())) return 0;
  return Math.max(0, Math.ceil((end - now) / 86400000));
}

/**
 * Format an ISO date string as "Sat, Oct 3" (en-US).
 *
 * @param {string} iso
 * @returns {string}
 */
export function formatEndDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
