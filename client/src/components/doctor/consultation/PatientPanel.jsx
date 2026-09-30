import { Calendar, Clock, Phone, Activity, CircleCheck, MessageSquare } from 'lucide-react';
import Card from '../../common/Card';
import ReadinessChecklist from './ReadinessChecklist';

/**
 * Left sidebar panel showing patient info, appointment details,
 * and a readiness checklist for in-progress consultations.
 *
 * @param {object}  props
 * @param {object}  props.consultation  - Populated consultation document.
 * @param {boolean} props.hasDiagnosis  - Whether diagnosis is non-empty.
 * @param {boolean} props.hasComplaint  - Whether chief complaint is non-empty.
 * @param {boolean} props.hasMedicines  - Whether at least one medicine has a name.
 */
export default function PatientPanel({ consultation, hasDiagnosis, hasComplaint, hasMedicines }) {
  if (!consultation) return null;

  const { patient, appointment, status, completedAt } = consultation;
  const patientName = patient?.fullName || 'Patient';
  const initial = patientName.charAt(0).toUpperCase();
  const patientEmail = patient?.email || '';
  const patientPhone = patient?.phone || '';
  const isCompleted = status === 'completed';

  const appointmentDate = appointment?.date
    ? new Date(appointment.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const completedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const reason = appointment?.reason || '';

  return (
    <Card className="dr-consult-patient">
      {/* Header band */}
      <div className="dr-consult-patient__header">
        <div className="dr-consult-patient__avatar">{initial}</div>
        <div className="dr-consult-patient__identity">
          <span className="dr-consult-patient__name">{patientName}</span>
          {patientEmail && (
            <span className="dr-consult-patient__email">{patientEmail}</span>
          )}
        </div>
        <span className={`dr-consult-patient__pill ${isCompleted ? 'dr-consult-patient__pill--completed' : 'dr-consult-patient__pill--progress'}`}>
          {isCompleted ? (
            <><CircleCheck size={14} aria-hidden="true" /> Completed</>
          ) : (
            <><Activity size={14} aria-hidden="true" /> In progress</>
          )}
        </span>
      </div>

      {/* Info rows */}
      <div className="dr-consult-patient__info">
        <div className="dr-consult-patient__row">
          <span className="dr-consult-patient__icon-tile">
            <Calendar size={14} aria-hidden="true" />
          </span>
          <span className="dr-consult-patient__row-label">Date</span>
          <span className="dr-consult-patient__row-value">{appointmentDate}</span>
        </div>
        <div className="dr-consult-patient__row">
          <span className="dr-consult-patient__icon-tile">
            <Clock size={14} aria-hidden="true" />
          </span>
          <span className="dr-consult-patient__row-label">Time</span>
          <span className="dr-consult-patient__row-value">{appointment?.timeSlot || '—'}</span>
        </div>
        <div className="dr-consult-patient__row">
          <span className="dr-consult-patient__icon-tile">
            <Phone size={14} aria-hidden="true" />
          </span>
          <span className="dr-consult-patient__row-label">Phone</span>
          <span className="dr-consult-patient__row-value">{patientPhone || '—'}</span>
        </div>

        {reason && (
          <div className="dr-consult-patient__reason">
            <MessageSquare size={14} aria-hidden="true" />
            <div>
              <span className="dr-consult-patient__reason-label">Reason for visit</span>
              <p className="dr-consult-patient__reason-text">{reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Readiness or completed date */}
      <div className="dr-consult-patient__footer">
        {isCompleted ? (
          <p className="dr-consult-patient__completed">
            <CircleCheck size={15} aria-hidden="true" />
            Completed on {completedDate}
          </p>
        ) : (
          <ReadinessChecklist
            hasDiagnosis={hasDiagnosis}
            hasComplaint={hasComplaint}
            hasMedicines={hasMedicines}
          />
        )}
      </div>
    </Card>
  );
}
