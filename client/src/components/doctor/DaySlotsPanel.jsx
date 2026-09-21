import { useState } from 'react';
import { Plus, Lock } from 'lucide-react';
import { formatDisplayDate } from '../../utils/dateUtils';
import { cancelMyDay } from '../../services/doctorService';
import SlotActionBar from './SlotActionBar';
import AvailabilityForm from './AvailabilityForm';

/**
 * Panel showing slots for a single day with time pills, actions, and inline forms.
 *
 * @param {{
 *   date: string,
 *   slots: Array,
 *   schedule: object,
 *   onSlotsChanged: () => void,
 *   onUndoMsg: (msg: string, undoInfo?: object) => void,
 * }} props
 */
export default function DaySlotsPanel({ date, slots, schedule, onSlotsChanged, onUndoMsg }) {
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDayOff, setConfirmDayOff] = useState(false);
  const [error, setError] = useState('');
  const [cancellingDay, setCancellingDay] = useState(false);

  const displayDate = formatDisplayDate(date);

  // Counts
  const openCount = slots.filter(s => s.status === 'open' && !s.isBooked).length;
  const bookedCount = slots.filter(s => s.isBooked).length;
  const cancelledCount = slots.filter(s => s.status === 'cancelled').length;

  const hasSlots = slots.length > 0;
  const canTakeDayOff = openCount > 0;

  // Build summary string, omitting zeros
  const summaryParts = [];
  if (openCount > 0) summaryParts.push(`${openCount} open`);
  if (bookedCount > 0) summaryParts.push(`${bookedCount} booked`);
  if (cancelledCount > 0) summaryParts.push(`${cancelledCount} cancelled`);
  const summaryStr = summaryParts.join(' · ');

  const selectedSlot = selectedSlotId ? slots.find(s => s.id === selectedSlotId) : null;

  function clearState() {
    setSelectedSlotId(null);
    setShowAddForm(false);
    setConfirmDayOff(false);
    setError('');
  }

  function handlePillClick(slotId) {
    setSelectedSlotId(prev => (prev === slotId ? null : slotId));
    setShowAddForm(false);
    setConfirmDayOff(false);
    setError('');
  }

  async function handleCancelDay() {
    setCancellingDay(true);
    setError('');
    try {
      // Collect open unbooked slot IDs before cancelling (for undo)
      const openSlotIds = slots
        .filter(s => s.status === 'open' && !s.isBooked)
        .map(s => s.id);

      const res = await cancelMyDay(date);
      clearState();
      onSlotsChanged();
      onUndoMsg(res.message || `Cancelled ${openSlotIds.length} open times. Booked times were kept.`, {
        type: 'day-off',
        slotIds: openSlotIds,
      });
    } catch (err) {
      setError(err.message || 'Failed to cancel the day.');
    } finally {
      setCancellingDay(false);
    }
  }

  function handleSlotActionDone(msg, undoInfo) {
    clearState();
    onSlotsChanged();
    if (undoInfo) {
      onUndoMsg(msg, undoInfo);
    } else {
      onUndoMsg(msg);
    }
  }

  function handleSlotActionError(msg) {
    setError(msg);
  }

  function handleExtraTimeCreated() {
    clearState();
    onSlotsChanged();
    onUndoMsg('Extra time added.');
  }

  return (
    <div className="sch2-day-panel">
      {/* Header */}
      <div className="sch2-day-panel__header">
        <div>
          <h3 className="sch2-day-panel__date">{displayDate}</h3>
          {hasSlots ? (
            <p className="sch2-day-panel__summary">{summaryStr}</p>
          ) : (
            <p className="sch2-day-panel__summary sch2-day-panel__summary--off">
              You&rsquo;re not scheduled to work this day.
            </p>
          )}
        </div>
        <div className="sch2-day-panel__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => {
              setShowAddForm(prev => !prev);
              setSelectedSlotId(null);
              setConfirmDayOff(false);
              setError('');
            }}
          >
            <Plus size={15} aria-hidden="true" />
            Add extra time
          </button>
          {canTakeDayOff && (
            <button
              type="button"
              className="button button--secondary sch2-btn--danger"
              onClick={() => {
                setConfirmDayOff(true);
                setSelectedSlotId(null);
                setShowAddForm(false);
                setError('');
              }}
            >
              Take the day off
            </button>
          )}
        </div>
      </div>

      {error && <p className="sch2-day-panel__error" role="alert">{error}</p>}

      {/* Day-off inline confirm */}
      {confirmDayOff && (
        <div className="sch2-confirm">
          <span>Cancel {openCount} open {openCount === 1 ? 'time' : 'times'}? Booked times stay.</span>
          <div className="sch2-confirm__btns">
            <button
              type="button"
              className="button button--secondary sch2-btn--danger"
              onClick={handleCancelDay}
              disabled={cancellingDay}
            >
              {cancellingDay ? 'Cancelling…' : 'Cancel times'}
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setConfirmDayOff(false)}
              disabled={cancellingDay}
            >
              Keep
            </button>
          </div>
        </div>
      )}

      {/* Add extra time — inline form */}
      {showAddForm && (
        <div className="sch2-day-panel__add-form">
          <AvailabilityForm
            onCreated={handleExtraTimeCreated}
            initialDate={date}
            hideDate
            defaultDuration={schedule?.slotDurationMinutes || 30}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Time pills */}
      {hasSlots ? (
        <>
          <div className="sch2-pills">
            {slots.map(slot => {
              const isOpen = slot.status === 'open' && !slot.isBooked;
              const isBooked = slot.isBooked;
              const isCancelled = slot.status === 'cancelled';
              const isSelected = selectedSlotId === slot.id;

              return (
                <button
                  key={slot.id}
                  type="button"
                  className={
                    'sch2-pill' +
                    (isOpen ? ' sch2-pill--open' : '') +
                    (isBooked ? ' sch2-pill--booked' : '') +
                    (isCancelled ? ' sch2-pill--cancelled' : '') +
                    (isSelected ? ' sch2-pill--sel' : '')
                  }
                  aria-pressed={isSelected}
                  onClick={() => handlePillClick(slot.id)}
                >
                  {isBooked && <Lock size={12} aria-hidden="true" />}
                  <span className={isCancelled ? 'sch2-pill__strike' : ''}>
                    {slot.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Slot action bar */}
          {selectedSlot ? (
            <SlotActionBar
              key={selectedSlot.id}
              slot={selectedSlot}
              onDone={handleSlotActionDone}
              onError={handleSlotActionError}
            />
          ) : (
            <p className="sch2-day-panel__hint">Select a time to cancel or change it.</p>
          )}
        </>
      ) : (
        <div className="sch2-day-panel__empty">
          <p className="sch2-day-panel__empty-title">No times on this day</p>
          <p className="sch2-day-panel__empty-desc">Use Add extra time to open a one-off slot.</p>
        </div>
      )}
    </div>
  );
}
