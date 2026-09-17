import { CalendarDays, Clock, X } from 'lucide-react';

/**
 * Displays a single appointment with doctor info, date, time, and status.
 *
 * @param {object}   props
 * @param {object}   props.appointment - Populated appointment document from the API.
 * @param {function} [props.onCancel]  - Called with appointment._id when the user cancels.
 */
export default function AppointmentCard({ appointment, onCancel }) {
  const { doctor, date, timeSlot, status, reason, _id } = appointment;

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="appointment-card">
      <div className="appointment-card__header">
        <div className="appointment-card__doctor">
          <strong>{doctor?.name ?? 'Doctor'}</strong>
          {doctor?.specialization && (
            <span className="appointment-card__specialization">{doctor.specialization}</span>
          )}
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
          {timeSlot}
        </span>
      </div>

      {reason && <p className="appointment-card__reason">{reason}</p>}

      {status === 'upcoming' && onCancel && (
        <button
          type="button"
          className="button button--text appointment-card__cancel"
          onClick={() => onCancel(_id)}
        >
          <X size={14} aria-hidden="true" />
          Cancel
        </button>
      )}
    </div>
  );
}
