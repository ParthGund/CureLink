import { useNavigate } from 'react-router-dom';
import { X, CalendarDays, Clock, User, Mail, Phone, FileText, Stethoscope } from 'lucide-react';

/**
 * Displays full appointment details in a modal overlay.
 *
 * @param {object}   props
 * @param {object}   props.appointment - Populated appointment document.
 * @param {function} props.onClose     - Called when the modal should close.
 * @param {function} [props.onCancel]  - Called with appointment._id to cancel.
 * @param {boolean}  [props.cancelling] - Whether a cancel request is in progress.
 */
export default function AppointmentDetailModal({ appointment, onClose, onCancel, cancelling, consultation, onStartConsultation, starting }) {
  const navigate = useNavigate();
  if (!appointment) return null;

  const { patient, date, timeSlot, status, reason, notes, createdAt, _id } = appointment;

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  const bookedOn = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  const patientName = patient?.fullName || 'Patient';
  const patientEmail = patient?.email || '—';
  const patientPhone = patient?.phone || '—';
  const statusLabel = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Scheduled';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-panel dr-apt-detail"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Appointment Details"
      >
        <div className="modal-header">
          <h2>Appointment Details</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="dr-apt-detail__body">
          {/* Status badge */}
          <div className="dr-apt-detail__status-row">
            <span className={`dr-apt-status dr-apt-status--${status}`}>
              {statusLabel}
            </span>
          </div>

          {/* Patient section */}
          <div className="dr-apt-detail__section">
            <h3 className="dr-apt-detail__section-title">Patient Information</h3>
            <dl className="dr-apt-detail__fields">
              <div className="dr-apt-detail__row">
                <dt><User size={15} aria-hidden="true" /> Name</dt>
                <dd>{patientName}</dd>
              </div>
              <div className="dr-apt-detail__row">
                <dt><Mail size={15} aria-hidden="true" /> Email</dt>
                <dd>{patientEmail}</dd>
              </div>
              <div className="dr-apt-detail__row">
                <dt><Phone size={15} aria-hidden="true" /> Phone</dt>
                <dd>{patientPhone}</dd>
              </div>
            </dl>
          </div>

          {/* Appointment section */}
          <div className="dr-apt-detail__section">
            <h3 className="dr-apt-detail__section-title">Appointment Information</h3>
            <dl className="dr-apt-detail__fields">
              <div className="dr-apt-detail__row">
                <dt><CalendarDays size={15} aria-hidden="true" /> Date</dt>
                <dd>{formattedDate}</dd>
              </div>
              <div className="dr-apt-detail__row">
                <dt><Clock size={15} aria-hidden="true" /> Time Slot</dt>
                <dd>{timeSlot}</dd>
              </div>
              <div className="dr-apt-detail__row">
                <dt><FileText size={15} aria-hidden="true" /> Booked On</dt>
                <dd>{bookedOn}</dd>
              </div>
            </dl>
          </div>

          {/* Reason */}
          {reason && (
            <div className="dr-apt-detail__section">
              <h3 className="dr-apt-detail__section-title">Reason for Visit</h3>
              <p className="dr-apt-detail__reason">{reason}</p>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <div className="dr-apt-detail__section">
              <h3 className="dr-apt-detail__section-title">Notes</h3>
              <p className="dr-apt-detail__reason">{notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="dr-apt-detail__actions">
            <button
              type="button"
              className="button button--secondary"
              onClick={onClose}
            >
              Close
            </button>
            {/* Consultation entry point */}
            {onStartConsultation && status !== 'cancelled' && !consultation && status !== 'completed' && (
              <button
                type="button"
                className="button"
                onClick={() => onStartConsultation(_id)}
                disabled={starting}
              >
                <Stethoscope size={15} aria-hidden="true" />
                {starting ? 'Starting…' : 'Start consultation'}
              </button>
            )}
            {consultation && consultation.status === 'in_progress' && (
              <button
                type="button"
                className="button"
                onClick={() => navigate(`/doctor/consultations/${consultation._id}`)}
              >
                <Stethoscope size={15} aria-hidden="true" /> Continue consultation
              </button>
            )}
            {consultation && consultation.status === 'completed' && (
              <button
                type="button"
                className="button button--secondary"
                onClick={() => navigate(`/doctor/consultations/${consultation._id}`)}
              >
                <Stethoscope size={15} aria-hidden="true" /> View consultation
              </button>
            )}
            {status === 'upcoming' && onCancel && (
              <button
                type="button"
                className="dr-apt-detail__cancel-btn"
                onClick={() => onCancel(_id)}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling…' : 'Cancel Appointment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
