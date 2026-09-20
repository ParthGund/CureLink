import { useState } from 'react';
import { X } from 'lucide-react';

const DAY_LABELS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const STANDARD_DURATIONS = [15, 20, 30, 45, 60];

export default function ScheduleSettingsModal({ schedule, onClose, onSave }) {
  const [form, setForm] = useState({
    workingDays: schedule?.workingDays || [],
    start: schedule?.workingHours?.start || '09:00',
    end: schedule?.workingHours?.end || '17:00',
    duration: schedule?.slotDurationMinutes || 30,
    breakStart: schedule?.breakTime?.start || '',
    breakEnd: schedule?.breakTime?.end || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // If current duration is non-standard, include it.
  const durationOptions = [...new Set([...STANDARD_DURATIONS, form.duration])].sort((a, b) => a - b);

  const toggleDay = (dayValue) => {
    setForm(prev => {
      const days = prev.workingDays.includes(dayValue)
        ? prev.workingDays.filter(d => d !== dayValue)
        : [...prev.workingDays, dayValue];
      return { ...prev, workingDays: days };
    });
  };

  const toMins = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.workingDays.length === 0) {
      return setError("Select at least one working day.");
    }
    if (toMins(form.end) <= toMins(form.start)) {
      return setError("End time must be after start time.");
    }
    if (form.breakStart || form.breakEnd) {
      if (!form.breakStart || !form.breakEnd || toMins(form.breakEnd) <= toMins(form.breakStart)) {
        return setError("Your break must fall within your working hours.");
      }
      if (toMins(form.breakStart) < toMins(form.start) || toMins(form.breakEnd) > toMins(form.end)) {
        return setError("Your break must fall within your working hours.");
      }
    }

    setSaving(true);
    try {
      await onSave({
        workingDays: form.workingDays,
        workingHours: { start: form.start, end: form.end },
        slotDurationMinutes: Number(form.duration),
        breakTime: { start: form.breakStart, end: form.breakEnd }
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save schedule settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="settings-modal-title">Edit schedule</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <p className="modal-error" role="alert">{error}</p>}
          
          <fieldset className="modal-fieldset">
            <legend className="modal-label">Available Days <span aria-hidden="true">*</span></legend>
            <div className="modal-days">
              {DAY_LABELS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`modal-day-chip ${form.workingDays.includes(value) ? 'modal-day-chip--active' : ''}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.workingDays.includes(value)}
                    onChange={() => toggleDay(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="modal-row">
            <label className="modal-field">
              <span className="modal-label">Start Time <span aria-hidden="true">*</span></span>
              <input
                type="time"
                className="modal-input"
                value={form.start}
                onChange={e => setForm({ ...form, start: e.target.value })}
                required
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">End Time <span aria-hidden="true">*</span></span>
              <input
                type="time"
                className="modal-input"
                value={form.end}
                onChange={e => setForm({ ...form, end: e.target.value })}
                required
              />
            </label>
          </div>

          <label className="modal-field">
            <span className="modal-label">Slot Duration <span aria-hidden="true">*</span></span>
            <select
              className="modal-input"
              value={form.duration}
              onChange={e => setForm({ ...form, duration: e.target.value })}
            >
              {durationOptions.map(dur => (
                <option key={dur} value={dur}>{dur} minutes</option>
              ))}
            </select>
          </label>

          <div className="modal-row">
            <label className="modal-field">
              <span className="modal-label">Break Start</span>
              <input
                type="time"
                className="modal-input"
                value={form.breakStart}
                onChange={e => setForm({ ...form, breakStart: e.target.value })}
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">Break End</span>
              <input
                type="time"
                className="modal-input"
                value={form.breakEnd}
                onChange={e => setForm({ ...form, breakEnd: e.target.value })}
              />
            </label>
          </div>
          <p className="modal-hint" style={{ marginTop: '-12px', marginBottom: '16px', fontSize: '13px', color: 'var(--color-slate-500)' }}>
            Leave empty for no break.
          </p>

          <p className="modal-hint" style={{ fontSize: '13px', color: 'var(--color-slate-600)', fontStyle: 'italic' }}>
            Saving rebuilds your upcoming open times. Booked times are kept.
          </p>

          <div className="modal-actions">
            <button type="button" className="button button--secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
