import { useState } from 'react';
import { formatShortDate } from '../../utils/dateUtils';

/**
 * Displays a doctor's available times as date tabs + slot chips.
 * View-only — slot selection and booking are Phase 4.
 *
 * @param {{ availability: Array<{ date: string, slots: Array<{ id: string, label: string }> }> }} props
 */
export default function DoctorAvailability({ availability }) {
  const [selectedDate, setSelectedDate] = useState(
    availability.length > 0 ? availability[0].date : null
  );

  if (availability.length === 0) return null;

  const selected = availability.find((d) => d.date === selectedDate);

  return (
    <div className="doctor-avail">
      <div className="doctor-avail__tabs" role="tablist" aria-label="Available dates">
        {availability.map(({ date }) => (
          <button
            key={date}
            type="button"
            role="tab"
            aria-selected={date === selectedDate}
            aria-pressed={date === selectedDate}
            className={`date-tab${date === selectedDate ? ' date-tab--active' : ''}`}
            onClick={() => setSelectedDate(date)}
          >
            {formatShortDate(date)}
          </button>
        ))}
      </div>

      {selected && (
        <div className="doctor-avail__slots" role="tabpanel" aria-label={`Slots for ${selectedDate}`}>
          <p className="doctor-avail__slots-heading">Available times</p>
          <div className="doctor-avail__chips">
            {selected.slots.map((slot) => (
              <span key={slot.id} className="slot-chip">{slot.label}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
