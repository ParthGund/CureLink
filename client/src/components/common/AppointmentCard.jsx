import { CalendarDays, Clock, X, CalendarClock } from 'lucide-react';

/** Map from API status value to a human-readable label. */
const STATUS_LABELS = {
  upcoming:  'Upcoming',
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  missed:    'Missed',
};

/**
 * Displays a single appointment with doctor info, date, time, status badge,
 * reason, and a cancel request button for active appointments.
 *
 * @param {object}   props
 * @param {object}   props.appointment        - Populated appointment document.
 * @param {function} [props.onCancelRequest]  - Called with the full appointment
 *                                             object when the patient requests
 *                                             cancellation. Parent is responsible
 *                                             for showing a confirmation modal.
 */
export default function AppointmentCard({ appointment, onCancelRequest, onRescheduleRequest }) {
  const { doctor, date, appointmentDate, timeSlot, status, reason } = appointment;

  const rawDate = appointmentDate || date;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date not available';

  const doctorName    = doctor?.name           || 'Dr. Assigned';
  const specialization = doctor?.specialization || 'General';
  const statusLabel   = STATUS_LABELS[status]  || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Scheduled');

  const canCancel = (status === 'scheduled' || status === 'confirmed' || status === 'upcoming') && onCancelRequest;
  const canReschedule = (status === 'scheduled' || status === 'confirmed' || status === 'upcoming') && onRescheduleRequest;

  return (
    <div className="appointment-card">
      <div className="appointment-card__header">
        <div className="appointment-card__doctor">
          <strong>{doctorName}</strong>
          <span className="appointment-card__specialization">{specialization}</span>
        </div>
        <span className={`appointment-card__status appointment-card__status--${status}`}>
          {statusLabel}
        </span>
      </div>

      <div className="appointment-card__details">
        <span className="appointment-card__detail">
          <CalendarDays size={15} aria-hidden="true" />
          {formattedDate}
        </span>
        <span className="appointment-card__detail">
          <Clock size={15} aria-hidden="true" />
          {timeSlot || '—'}
        </span>
      </div>

      {reason && <p className="appointment-card__reason">{reason}</p>}

      {(canCancel || canReschedule) && (
        <div className="appointment-card__actions">
          {canReschedule && (
            <button
              type="button"
              className="appointment-card__reschedule"
              onClick={() => onRescheduleRequest(appointment)}
            >
              <CalendarClock size={14} aria-hidden="true" />
              Reschedule
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              className="appointment-card__cancel"
              onClick={() => onCancelRequest(appointment)}
            >
              <X size={14} aria-hidden="true" />
              Cancel appointment
            </button>
          )}
        </div>
      )}
    </div>
  );
}
