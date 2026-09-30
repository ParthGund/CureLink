import { CheckCircle2, Printer, CalendarDays, Activity, Pill, Stethoscope } from 'lucide-react';
import Card from '../common/Card';

/**
 * Format a date for display in the prescription "Active until" chip.
 */
function formatChipDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MedicalRecordCard({ record, isPrinting, onPrint }) {
  const { doctor, date, diagnosis, chiefComplaint, prescriptions, notes, vitals } = record;

  const doctorName = doctor?.name || 'Dr. Assigned';
  const specialization = doctor?.specialization || 'General';

  const formattedDate = date
    ? new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Date not available';

  const cardClass = `medical-record-card${isPrinting ? ' medical-record-card--printing' : ''}`;

  return (
    <Card className={cardClass}>
      <div className="medical-record-card__header">
        <div className="medical-record-card__doctor-info">
          <h3>{doctorName}</h3>
          <span className="medical-record-card__specialization">{specialization}</span>
        </div>
        <div className="medical-record-card__meta">
          <span className="medical-record-card__badge medical-record-card__badge--verified">
            <CheckCircle2 size={14} />
            Verified Record
          </span>
          <button
            type="button"
            className="icon-button icon-button--print"
            aria-label="Print record"
            onClick={onPrint || undefined}
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      <div className="medical-record-card__body">
        <div className="medical-record-card__date-bar">
          <CalendarDays size={15} />
          <span>Consultation Date: <strong>{formattedDate}</strong></span>
        </div>

        {(diagnosis || chiefComplaint) && (
          <div className="medical-record-card__section">
            <h4 className="medical-record-card__section-title">
              <Stethoscope size={16} /> Diagnosis
            </h4>
            <div className="medical-record-card__diagnosis-box">
              {chiefComplaint && (
                <div className="mh-reason">
                  <span className="mh-reason__label">Reason for visit</span>
                  <p className="mh-reason__text">{chiefComplaint}</p>
                </div>
              )}
              {diagnosis && (
                <p className="medical-record-card__primary-diagnosis">{diagnosis}</p>
              )}
              {vitals && (
                <div className="medical-record-card__vitals">
                  {vitals.bp && <span><strong>BP:</strong> {vitals.bp}</span>}
                  {vitals.temp && <span><strong>Temp:</strong> {vitals.temp}</span>}
                  {vitals.weight && <span><strong>Weight:</strong> {vitals.weight}</span>}
                </div>
              )}
            </div>
          </div>
        )}

        {prescriptions && prescriptions.length > 0 && (
          <div className="medical-record-card__section">
            <h4 className="medical-record-card__section-title">
              <Pill size={16} /> Prescriptions
            </h4>
            <div className="medical-record-card__prescriptions">
              {prescriptions.map((med, idx) => {
                const freqDur = [med.frequency, med.duration].filter(Boolean).join(' · ');
                return (
                  <div key={idx} className="prescription-pill">
                    <div className="prescription-pill__main">
                      <strong>{med.name}</strong>
                      {med.dosage && (
                        <span className="prescription-pill__dosage">{med.dosage}</span>
                      )}
                    </div>
                    {freqDur && <span className="mh-pill-freq">{freqDur}</span>}
                    {med.instructions && (
                      <span className="prescription-pill__instructions">{med.instructions}</span>
                    )}
                    {med.isActive && med.endsOn && (
                      <span className="mh-active-chip">Active until {formatChipDate(med.endsOn)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {notes && (
          <div className="medical-record-card__section">
            <h4 className="medical-record-card__section-title">
              <Activity size={16} /> Clinical Notes
            </h4>
            <div className="medical-record-card__notes-box">
              <p>{notes}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
