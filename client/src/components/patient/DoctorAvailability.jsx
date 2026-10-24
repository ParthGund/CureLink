import { useState, useEffect } from 'react';
import { formatShortDate } from '../../utils/dateUtils';
import { getAvailableSlots } from '../../services/appointmentService';

/**
 * Parses an "H:MM AM/PM" or "HH:MM" time label and returns the total
 * minutes since midnight, used for shift bucketing.
 * Returns -1 on parse failure so the slot falls into Morning by default.
 */
function slotMinutes(label) {
  if (!label) return -1;

  // Match "H:MM AM/PM" or "H:MM am/pm"
  const ampm = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const isPM = ampm[3].toUpperCase() === 'PM';
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    return h * 60 + m;
  }

  // Match "HH:MM" 24-hour
  const h24 = label.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) return parseInt(h24[1], 10) * 60 + parseInt(h24[2], 10);

  return -1;
}

const SHIFTS = [
  { key: 'morning',   label: 'Morning',   icon: '🌅', maxMinutes: 719  }, // < 12:00
  { key: 'afternoon', label: 'Afternoon', icon: '☀️', maxMinutes: 1019 }, // 12:00–16:59
  { key: 'evening',   label: 'Evening',   icon: '🌆', maxMinutes: Infinity }, // 17:00+
];

/**
 * Groups an array of slot label strings into the three shifts.
 * Returns only shifts that have at least one slot.
 */
function groupByShift(slots) {
  const groups = { morning: [], afternoon: [], evening: [] };

  slots.forEach((label) => {
    const mins = slotMinutes(label);
    if (mins < 720) {
      groups.morning.push(label);
    } else if (mins < 1020) {
      groups.afternoon.push(label);
    } else {
      groups.evening.push(label);
    }
  });

  return SHIFTS
    .map((shift) => ({ ...shift, slots: groups[shift.key] }))
    .filter((shift) => shift.slots.length > 0);
}

/**
 * Displays a doctor's available dates as tabs and fetches live slot chips
 * for the selected date. Slots are grouped into Morning / Afternoon / Evening
 * shifts. Booked/unavailable ones are shown as disabled.
 *
 * @param {object}   props
 * @param {string}   props.doctorId       - Doctor _id used to fetch slots.
 * @param {Array}    props.availability   - Static shape from getDoctorAvailability:
 *                                         Array<{ date: string, slots: Array<{id,label}> }>
 * @param {string}   props.selectedSlot   - Currently selected slot label.
 * @param {Function} props.onSlotSelect   - Called with (date, slotLabel) on chip click.
 */
export default function DoctorAvailability({
  doctorId,
  availability,
  selectedSlot,
  onSlotSelect,
}) {
  const [selectedDate, setSelectedDate] = useState(
    availability.length > 0 ? availability[0].date : null
  );
  const [liveSlots, setLiveSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch live available slots whenever doctor or date changes.
  useEffect(() => {
    if (!doctorId || !selectedDate) {
      setLiveSlots([]);
      return;
    }
    setLoadingSlots(true);
    getAvailableSlots(doctorId, selectedDate)
      .then((slots) => setLiveSlots(slots ?? []))
      .catch(() => setLiveSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctorId, selectedDate]);

  if (availability.length === 0) return null;

  function handleDateChange(date) {
    setSelectedDate(date);
    // Clear slot selection when date changes (parent manages selectedSlot state)
    if (onSlotSelect) onSlotSelect(date, null);
  }

  const shiftGroups = groupByShift(liveSlots);

  return (
    <div className="doctor-avail">
      {/* Date tabs */}
      <div className="doctor-avail__tabs" role="tablist" aria-label="Available dates">
        {availability.map(({ date }) => (
          <button
            key={date}
            type="button"
            role="tab"
            aria-selected={date === selectedDate}
            className={`date-tab${date === selectedDate ? ' date-tab--active' : ''}`}
            onClick={() => handleDateChange(date)}
          >
            {formatShortDate(date)}
          </button>
        ))}
      </div>

      {/* Slot chips — grouped by shift */}
      {selectedDate && (
        <div
          className="doctor-avail__slots"
          role="tabpanel"
          aria-label={`Slots for ${selectedDate}`}
        >
          {loadingSlots ? (
            <p className="loading-text">Loading slots…</p>
          ) : liveSlots.length === 0 ? (
            <p className="doctor-avail__no-slots">
              No available slots for this date.
            </p>
          ) : (
            <div className="slot-shifts">
              {shiftGroups.map(({ key, label, icon, slots }) => (
                <div key={key} className="slot-shift">
                  <p className="slot-shift__label">
                    <span aria-hidden="true">{icon}</span> {label}
                  </p>
                  <div className="slot-shift__chips">
                    {slots.map((slotLabel) => {
                      const isSelected = selectedSlot === slotLabel;
                      return (
                        <button
                          key={slotLabel}
                          type="button"
                          className={`slot-chip slot-chip--available${
                            isSelected ? ' slot-chip--selected' : ''
                          }`}
                          aria-pressed={isSelected}
                          onClick={() =>
                            onSlotSelect && onSlotSelect(selectedDate, slotLabel)
                          }
                        >
                          {slotLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
