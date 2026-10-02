import { CheckCircle2, Printer, CalendarDays, Activity, Pill, Stethoscope } from 'lucide-react';
import Card from '../common/Card';

/**
 * Formats a prescription item's dosage line.
 * Produces e.g. "3 · Once daily · 5 days" from available item fields.
 *
 * @param {object} item - Prescription item from the API.
 * @returns {string} Formatted dosage string.
 */
function formatDosageLine(item) {
  const parts = [];
  if (item.dosage) parts.push(item.dosage);
  if (item.frequency) parts.push(item.frequency);
  if (item.duration) {
    parts.push(item.duration);
  } else if (item.durationDays) {
    parts.push(`${item.durationDays} day${item.durationDays !== 1 ? 's' : ''}`);
  }
  return parts.join(' · ');
}

export default function MedicalRecordCard({ record }) {
  const {
    doctor,
    date,
    chiefComplaint,
    diagnosis,
    prescriptionItems,
    clinicalNotes,
  } = record;

  const doctorName = doctor?.name || 'Doctor';
  const specialization = doctor?.specialization || '';

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
          {specialization && (
            <span className="medical-record-card__specialization">{specialization}</span>
          )}
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
            onClick={() => window.print()}
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

        {(chiefComplaint || diagnosis) && (
          <div className="medical-record-card__section">
            <h4 className="medical-record-card__section-title">
              <Stethoscope size={16} /> Diagnosis
            </h4>
            <div className="medical-record-card__diagnosis-box">
              {chiefComplaint && (
                <p className="medical-record-card__chief-complaint">
                  <span className="medical-record-card__label">Chief Complaint:</span>{' '}
                  {chiefComplaint}
                </p>
              )}
              {diagnosis && (
                <p className="medical-record-card__primary-diagnosis">{diagnosis}</p>
              )}
            </div>
          </div>
        )}

        {prescriptionItems && prescriptionItems.length > 0 && (
          <div className="medical-record-card__section">
            <h4 className="medical-record-card__section-title">
              <Pill size={16} /> Prescriptions
            </h4>
            <div className="medical-record-card__prescriptions">
              {prescriptionItems.map((item, idx) => {
                const dosageLine = formatDosageLine(item);
                return (
                  <div key={idx} className="prescription-pill">
                    <div className="prescription-pill__main">
                      <strong>{item.medicine}</strong>
                      {dosageLine && (
                        <span className="prescription-pill__dosage">{dosageLine}</span>
                      )}
                    </div>
                    {item.instructions && (
                      <span className="prescription-pill__instructions">
                        {item.instructions}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {clinicalNotes && (
          <div className="medical-record-card__section">
            <h4 className="medical-record-card__section-title">
              <Activity size={16} /> Clinical Notes
            </h4>
            <div className="medical-record-card__notes-box">
              <p>{clinicalNotes}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
