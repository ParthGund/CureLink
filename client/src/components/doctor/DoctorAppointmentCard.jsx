import { CalendarDays, Clock, User } from 'lucide-react';

/**
 * Displays a single appointment from the doctor's perspective.
 * Shows patient info, date, time, status, and reason.
 *
 * @param {object}   props
 * @param {object}   props.appointment - Populated appointment document from the API.
 * @param {function} [props.onSelect]  - Called with appointment._id when the card is clicked.
 */
export default function DoctorAppointmentCard({ appointment, onSelect }) {
  const { patient, date, timeSlot, status, reason, _id } = appointment;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date not available';

  const patientName = patient?.fullName || 'Patient';
  const patientEmail = patient?.email || '';
  const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Scheduled';

  return (
    <button
      type="button"
      className="dr-apt-card"
      onClick={() => onSelect && onSelect(_id)}
      aria-label={`Appointment with ${patientName} on ${formattedDate}`}
    >
      <div className="dr-apt-card__header">
        <div className="dr-apt-card__patient">
          <span className="dr-apt-card__avatar">
            <User size={16} aria-hidden="true" />
          </span>
          <div className="dr-apt-card__identity">
            <strong>{patientName}</strong>
            {patientEmail && (
              <span className="dr-apt-card__email">{patientEmail}</span>
            )}
          </div>
        </div>
        <span className={`dr-apt-card__status dr-apt-card__status--${status}`}>
          {statusLabel}
        </span>
      </div>

      <div className="dr-apt-card__details">
        <span className="dr-apt-card__detail">
          <CalendarDays size={15} aria-hidden="true" />
          {formattedDate}
        </span>
        <span className="dr-apt-card__detail">
          <Clock size={15} aria-hidden="true" />
          {timeSlot}
        </span>
      </div>

      {reason && <p className="dr-apt-card__reason">{reason}</p>}
    </button>
  );
}
