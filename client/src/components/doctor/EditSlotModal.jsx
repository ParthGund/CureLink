import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getTodayIso } from '../../utils/dateUtils';
import { updateMySlot } from '../../services/doctorService';

/**
 * Modal for editing a single slot's date, start time, and end time.
 * Reuses modal-* CSS classes shared with AddDoctorModal.
 *
 * @param {{
 *   slot: { id: string, date: string, startTime: string, endTime: string, label: string },
 *   onClose: () => void,
 *   onSaved: () => void,
 * }} props
 */
export default function EditSlotModal({ slot, onClose, onSaved }) {
  const today = getTodayIso();

  const [date, setDate] = useState(slot.date);
  const [startTime, setStartTime] = useState(slot.startTime);
  const [endTime, setEndTime] = useState(slot.endTime);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Close on Escape key
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function validate() {
    if (!date) return 'Date is required.';
    if (!startTime) return 'Start time is required.';
    if (!endTime) return 'End time is required.';
    if (endTime <= startTime) return 'End time must be after start time.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      await updateMySlot(slot.id, { date, startTime, endTime });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update slot. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Edit time slot"
    >
      <div className="modal-panel">
        <header className="modal-header">
          <h2>Edit time slot</h2>
          <button
            className="modal-close"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {error && <p className="modal-error" role="alert">{error}</p>}

          <label className="modal-field">
            <span className="modal-label">Date</span>
            <input
              type="date"
              className="modal-input"
              min={today}
              value={date}
              onChange={(e) => { setDate(e.target.value); setError(''); }}
              required
            />
          </label>

          <div className="modal-row">
            <label className="modal-field">
              <span className="modal-label">Start time</span>
              <input
                type="time"
                className="modal-input"
                value={startTime}
                onChange={(e) => { setStartTime(e.target.value); setError(''); }}
                required
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">End time</span>
              <input
                type="time"
                className="modal-input"
                value={endTime}
                onChange={(e) => { setEndTime(e.target.value); setError(''); }}
                required
              />
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="button" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
