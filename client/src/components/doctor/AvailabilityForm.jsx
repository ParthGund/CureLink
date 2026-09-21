import { useState } from 'react';
import { getTodayIso } from '../../utils/dateUtils';
import { createMySlots } from '../../services/doctorService';

const ALLOWED_DURATIONS = [15, 20, 30, 45, 60];

/**
 * Compute how many full slots fit in [startTime, endTime) with a given duration.
 * Returns 0 if inputs are incomplete or invalid.
 */
function computeSlotCount(startTime, endTime, durationMinutes) {
  if (!startTime || !endTime || !durationMinutes) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  const window = endMins - startMins;
  if (window <= 0) return 0;
  return Math.floor(window / durationMinutes);
}

/**
 * Form for a doctor to add a block of available time slots.
 * @param {{
 *   onCreated: () => void,
 *   initialDate?: string,
 *   hideDate?: boolean,
 *   defaultDuration?: number,
 *   onCancel?: () => void,
 * }} props
 */
export default function AvailabilityForm({
  onCreated,
  initialDate,
  hideDate,
  defaultDuration,
  onCancel,
}) {
  const today = getTodayIso();

  const [date, setDate] = useState(initialDate || '');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState(defaultDuration || 30);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // When hideDate is set, use initialDate instead of the date field
  const effectiveDate = hideDate ? (initialDate || '') : date;

  // Derived — not stored in state
  const slotCount = computeSlotCount(startTime, endTime, duration);
  const canSubmit = effectiveDate && startTime && endTime && slotCount > 0 && !submitting;

  function resetForm() {
    setDate(initialDate || '');
    setStartTime('');
    setEndTime('');
    setDuration(defaultDuration || 30);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createMySlots({
        date: effectiveDate,
        startTime,
        endTime,
        slotDurationMinutes: duration,
      });
      resetForm();
      onCreated();
    } catch (err) {
      setError(err.message || 'Failed to create slots. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="avail-form" onSubmit={handleSubmit} noValidate>
      {error && <p className="schedule-msg schedule-msg--error" role="alert">{error}</p>}

      {!hideDate && (
        <div className="avail-form__field">
          <label className="avail-form__label" htmlFor="af-date">Date</label>
          <input
            id="af-date"
            type="date"
            className="avail-form__input"
            min={today}
            value={date}
            onChange={(e) => { setDate(e.target.value); setError(''); }}
            required
          />
        </div>
      )}

      <div className="avail-form__row">
        <div className="avail-form__field">
          <label className="avail-form__label" htmlFor="af-start">Start time</label>
          <input
            id="af-start"
            type="time"
            className="avail-form__input"
            value={startTime}
            onChange={(e) => { setStartTime(e.target.value); setError(''); }}
            required
          />
        </div>
        <div className="avail-form__field">
          <label className="avail-form__label" htmlFor="af-end">End time</label>
          <input
            id="af-end"
            type="time"
            className="avail-form__input"
            value={endTime}
            onChange={(e) => { setEndTime(e.target.value); setError(''); }}
            required
          />
        </div>
      </div>

      <div className="avail-form__field">
        <label className="avail-form__label" htmlFor="af-duration">Slot length</label>
        <select
          id="af-duration"
          className="avail-form__input"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        >
          {ALLOWED_DURATIONS.map((d) => (
            <option key={d} value={d}>{d} minutes</option>
          ))}
        </select>
      </div>

      <p className="avail-form__preview">
        {slotCount > 0
          ? `This will create ${slotCount} time ${slotCount === 1 ? 'slot' : 'slots'}.`
          : 'Enter a date, start time, and end time to see a preview.'}
      </p>

      <div className="avail-form__actions">
        <button
          type="submit"
          className="button"
          disabled={!canSubmit}
        >
          {submitting ? 'Adding…' : 'Add slots'}
        </button>
        {onCancel && (
          <button
            type="button"
            className="button button--secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
