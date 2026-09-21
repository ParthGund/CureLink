import { useState } from 'react';

const DAY_OPTIONS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const STANDARD_DURATIONS = [15, 20, 30, 45, 60];

/**
 * Inline editing form for weekly working hours.
 * `onSave` must throw on failure so this component can display the error.
 *
 * @param {{
 *   schedule: object,
 *   onSave: (payload: object) => Promise<void>,
 *   onCancel: () => void,
 * }} props
 */
export default function WeeklyHoursForm({ schedule, onSave, onCancel }) {
  const [days, setDays] = useState(schedule?.workingDays || []);
  const [start, setStart] = useState(schedule?.workingHours?.start || '09:00');
  const [end, setEnd] = useState(schedule?.workingHours?.end || '17:00');
  const [duration, setDuration] = useState(schedule?.slotDurationMinutes || 30);
  const [hasBreak, setHasBreak] = useState(
    Boolean(schedule?.breakTime?.start && schedule?.breakTime?.end)
  );
  const [breakStart, setBreakStart] = useState(schedule?.breakTime?.start || '');
  const [breakEnd, setBreakEnd] = useState(schedule?.breakTime?.end || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Include any non-standard saved duration in the options
  const durations = [...new Set([...STANDARD_DURATIONS, duration])].sort((a, b) => a - b);

  function toMins(t) {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  function toggleDay(val) {
    setDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    );
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (days.length === 0) {
      return setError('Select at least one working day.');
    }
    if (toMins(end) <= toMins(start)) {
      return setError('End time must be after start time.');
    }
    if (hasBreak) {
      if (!breakStart || !breakEnd || toMins(breakEnd) <= toMins(breakStart)) {
        return setError('Your break must fall within your working hours.');
      }
      if (toMins(breakStart) < toMins(start) || toMins(breakEnd) > toMins(end)) {
        return setError('Your break must fall within your working hours.');
      }
    }

    setSaving(true);
    try {
      await onSave({
        workingDays: days,
        workingHours: { start, end },
        slotDurationMinutes: Number(duration),
        breakTime: hasBreak ? { start: breakStart, end: breakEnd } : { start: '', end: '' },
      });
    } catch (err) {
      setError(err.message || 'Failed to save schedule settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="sch2-wh-form" onSubmit={handleSubmit} noValidate>
      {/* Day chips */}
      <fieldset className="sch2-wh-form__fieldset">
        <legend className="sch2-wh-form__legend">Working days</legend>
        <div className="sch2-wh-form__chips">
          {DAY_OPTIONS.map(({ value, label }) => (
            <label
              key={value}
              className={`sch2-chip ${days.includes(value) ? 'sch2-chip--on' : ''}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={days.includes(value)}
                onChange={() => toggleDay(value)}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Start / End time */}
      <div className="sch2-wh-form__row">
        <label className="sch2-wh-form__field">
          <span className="sch2-wh-form__label">Start time</span>
          <input
            type="time"
            className="sch2-wh-form__input"
            value={start}
            onChange={e => { setStart(e.target.value); setError(''); }}
            required
          />
        </label>
        <label className="sch2-wh-form__field">
          <span className="sch2-wh-form__label">End time</span>
          <input
            type="time"
            className="sch2-wh-form__input"
            value={end}
            onChange={e => { setEnd(e.target.value); setError(''); }}
            required
          />
        </label>
      </div>

      {/* Visit length — segmented control */}
      <fieldset className="sch2-wh-form__fieldset">
        <legend className="sch2-wh-form__legend">Visit length</legend>
        <div className="sch2-seg" role="radiogroup">
          {durations.map(d => (
            <label
              key={d}
              className={`sch2-seg__item ${duration === d ? 'sch2-seg__item--on' : ''}`}
            >
              <input
                type="radio"
                className="sr-only"
                name="sch2-duration"
                value={d}
                checked={duration === d}
                onChange={() => setDuration(d)}
              />
              {d} min
            </label>
          ))}
        </div>
      </fieldset>

      {/* Break toggle */}
      <label className="sch2-wh-form__check">
        <input
          type="checkbox"
          checked={hasBreak}
          onChange={e => {
            setHasBreak(e.target.checked);
            if (!e.target.checked) { setBreakStart(''); setBreakEnd(''); }
            setError('');
          }}
        />
        I take a break during the day
      </label>

      {hasBreak && (
        <div className="sch2-wh-form__row">
          <label className="sch2-wh-form__field">
            <span className="sch2-wh-form__label">Break starts</span>
            <input
              type="time"
              className="sch2-wh-form__input"
              value={breakStart}
              onChange={e => { setBreakStart(e.target.value); setError(''); }}
              required
            />
          </label>
          <label className="sch2-wh-form__field">
            <span className="sch2-wh-form__label">Break ends</span>
            <input
              type="time"
              className="sch2-wh-form__input"
              value={breakEnd}
              onChange={e => { setBreakEnd(e.target.value); setError(''); }}
              required
            />
          </label>
        </div>
      )}

      <p className="sch2-wh-form__hint">
        Saving rebuilds your upcoming open times. Booked times are kept.
      </p>

      {error && <p className="sch2-wh-form__error" role="alert">{error}</p>}

      <div className="sch2-wh-form__actions">
        <button type="submit" className="button" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
