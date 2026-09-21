import { useState } from 'react';
import { Lock } from 'lucide-react';
import { updateMySlot } from '../../services/doctorService';

/**
 * Inline action bar for a selected time slot.
 * Shows the time range, status badge, and only the relevant actions.
 *
 * @param {{
 *   slot: { id: string, startTime: string, endTime: string, label: string, status: string, isBooked: boolean },
 *   onDone: (msg: string, undoInfo?: object) => void,
 *   onError: (msg: string) => void,
 * }} props
 */
export default function SlotActionBar({ slot, onDone, onError }) {
  const [changingTime, setChangingTime] = useState(false);
  const [newStart, setNewStart] = useState(slot.startTime);
  const [newEnd, setNewEnd] = useState(slot.endTime);
  const [editError, setEditError] = useState('');
  const [busy, setBusy] = useState(false);

  const isOpen = slot.status === 'open' && !slot.isBooked;
  const isCancelled = slot.status === 'cancelled';
  const isBooked = slot.isBooked;

  async function handleCancel() {
    setBusy(true);
    try {
      await updateMySlot(slot.id, { status: 'cancelled' });
      onDone(`Cancelled ${slot.label}.`, {
        type: 'cancel-slot',
        slotId: slot.id,
      });
    } catch (err) {
      onError(err.message || 'Failed to cancel this time.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReopen() {
    setBusy(true);
    try {
      await updateMySlot(slot.id, { status: 'open' });
      onDone(`Reopened ${slot.label}.`);
    } catch (err) {
      onError(err.message || 'Failed to reopen this time.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTime(e) {
    e.preventDefault();
    setEditError('');
    if (newEnd <= newStart) {
      return setEditError('End time must be after start time.');
    }
    setBusy(true);
    try {
      await updateMySlot(slot.id, { startTime: newStart, endTime: newEnd });
      const fmtTime = (t) => {
        const [h, m] = t.split(':');
        const d = new Date();
        d.setHours(h, m);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      };
      onDone(`Time updated to ${fmtTime(newStart)} – ${fmtTime(newEnd)}.`, {
        type: 'change-time',
        slotId: slot.id,
        prevStart: slot.startTime,
        prevEnd: slot.endTime,
      });
    } catch (err) {
      setEditError(err.message || 'Failed to update this time.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sch2-action-bar">
      <div className="sch2-action-bar__header">
        <span className="sch2-action-bar__time">
          {slot.startTime && slot.endTime
            ? (() => {
                const fmtTime = (t) => {
                  const [h, m] = t.split(':');
                  const d = new Date();
                  d.setHours(h, m);
                  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                };
                return `${fmtTime(slot.startTime)} – ${fmtTime(slot.endTime)}`;
              })()
            : slot.label}
        </span>
        {isBooked && <span className="sch2-action-bar__badge sch2-action-bar__badge--booked"><Lock size={12} aria-hidden="true" /> Booked</span>}
        {isCancelled && <span className="sch2-action-bar__badge sch2-action-bar__badge--cancelled">Cancelled</span>}
        {isOpen && <span className="sch2-action-bar__badge sch2-action-bar__badge--open">Open</span>}
      </div>

      {/* Booked — info only */}
      {isBooked && (
        <p className="sch2-action-bar__note">
          This time is booked, so it can&rsquo;t be changed or cancelled.
        </p>
      )}

      {/* Open — change time or cancel */}
      {isOpen && !changingTime && (
        <div className="sch2-action-bar__btns">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setChangingTime(true)}
            disabled={busy}
          >
            Change time
          </button>
          <button
            type="button"
            className="button button--secondary sch2-btn--danger"
            onClick={handleCancel}
            disabled={busy}
          >
            {busy ? 'Cancelling…' : 'Cancel this time'}
          </button>
        </div>
      )}

      {/* Inline time editor */}
      {isOpen && changingTime && (
        <form className="sch2-action-bar__edit" onSubmit={handleSaveTime} noValidate>
          <div className="sch2-action-bar__edit-row">
            <label className="sch2-action-bar__edit-field">
              <span className="sch2-wh-form__label">Start</span>
              <input
                type="time"
                className="sch2-wh-form__input"
                value={newStart}
                onChange={e => { setNewStart(e.target.value); setEditError(''); }}
                required
              />
            </label>
            <label className="sch2-action-bar__edit-field">
              <span className="sch2-wh-form__label">End</span>
              <input
                type="time"
                className="sch2-wh-form__input"
                value={newEnd}
                onChange={e => { setNewEnd(e.target.value); setEditError(''); }}
                required
              />
            </label>
          </div>
          {editError && <p className="sch2-wh-form__error" role="alert">{editError}</p>}
          <div className="sch2-action-bar__btns">
            <button type="submit" className="button" disabled={busy}>
              {busy ? 'Saving…' : 'Save time'}
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => { setChangingTime(false); setEditError(''); }}
              disabled={busy}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Cancelled — reopen */}
      {isCancelled && (
        <div className="sch2-action-bar__btns">
          <button
            type="button"
            className="button button--secondary"
            onClick={handleReopen}
            disabled={busy}
          >
            {busy ? 'Reopening…' : 'Reopen this time'}
          </button>
        </div>
      )}
    </div>
  );
}
