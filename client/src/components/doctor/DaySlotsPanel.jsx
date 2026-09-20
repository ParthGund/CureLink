import { formatDisplayDate } from '../../utils/dateUtils';
import { updateMySlot, cancelMyDay } from '../../services/doctorService';
import { useState } from 'react';
import EditSlotModal from './EditSlotModal';

export default function DaySlotsPanel({ date, slots, onSlotsChanged }) {
  const [editingSlot, setEditingSlot] = useState(null);
  const [cancellingDay, setCancellingDay] = useState(false);
  const [msg, setMsg] = useState('');

  const displayDate = formatDisplayDate(date);
  
  // A day can be cancelled if there is at least one open, unbooked slot
  const canCancelDay = slots.some(s => s.status === 'open' && !s.isBooked);

  const handleCancelDay = async () => {
    if (!window.confirm(`Cancel all open times on ${displayDate}? Booked times stay.`)) return;
    
    setCancellingDay(true);
    setMsg('');
    try {
      const res = await cancelMyDay(date);
      setMsg(res.message);
      onSlotsChanged();
    } catch (err) {
      setMsg(err.message || 'Failed to cancel day.');
    } finally {
      setCancellingDay(false);
    }
  };

  const handleToggleStatus = async (slot) => {
    const newStatus = slot.status === 'cancelled' ? 'open' : 'cancelled';
    setMsg('');
    try {
      await updateMySlot(slot.id, { status: newStatus });
      onSlotsChanged();
    } catch (err) {
      setMsg(err.message || `Failed to ${newStatus === 'open' ? 'reopen' : 'cancel'} slot.`);
    }
  };

  return (
    <div className="schedule-day-panel">
      <div className="schedule-day-header">
        <h3>{displayDate}</h3>
        <button
          type="button"
          className="button button--secondary"
          onClick={handleCancelDay}
          disabled={!canCancelDay || cancellingDay}
        >
          {cancellingDay ? 'Cancelling…' : 'Cancel day'}
        </button>
      </div>

      {msg && <p className="schedule-msg schedule-msg--info" role="status">{msg}</p>}

      {slots.length === 0 ? (
        <p className="schedule-empty-day">No times on this day.</p>
      ) : (
        <div className="schedule-slot-grid">
          {slots.map(slot => {
            const isCancelled = slot.status === 'cancelled';
            return (
              <div key={slot.id} className={`schedule-slot-card ${isCancelled ? 'schedule-slot-card--cancelled' : ''}`}>
                <div className="schedule-slot-card__info">
                  <span className="schedule-slot-card__time">{slot.label}</span>
                  <span className="schedule-slot-card__range">{slot.startTime} – {slot.endTime}</span>
                  {slot.isBooked && <span className="schedule-slot-card__badge schedule-slot-card__badge--booked">Booked</span>}
                  {isCancelled && <span className="schedule-slot-card__badge schedule-slot-card__badge--cancelled">Cancelled</span>}
                </div>
                <div className="schedule-slot-card__actions">
                  {slot.isBooked ? (
                    <button type="button" className="button button--text" disabled title="Cannot edit booked slot">Edit</button>
                  ) : isCancelled ? (
                    <button type="button" className="button button--text" onClick={() => handleToggleStatus(slot)}>Reopen</button>
                  ) : (
                    <>
                      <button type="button" className="button button--text" onClick={() => setEditingSlot(slot)}>Edit</button>
                      <button type="button" className="button button--text" onClick={() => handleToggleStatus(slot)}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingSlot && (
        <EditSlotModal
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
          onSaved={() => {
            setEditingSlot(null);
            onSlotsChanged();
          }}
        />
      )}
    </div>
  );
}
