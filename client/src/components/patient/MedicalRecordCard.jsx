import { CheckCircle2, Printer, CalendarDays, Activity, Pill, Stethoscope } from 'lucide-react';
import Card from '../common/Card';

export default function MedicalRecordCard({ record }) {
  const { doctor, date, diagnosis, prescriptions, notes, vitals } = record;

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

  return (
    <Card className="medical-record-card">
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
          <button type="button" className="icon-button icon-button--print" aria-label="Print record" onClick={() => window.print()}>
            <Printer size={16} />
          </button>
        </div>
      </div>

      <div className="medical-record-card__body">
        <div className="medical-record-card__date-bar">
          <CalendarDays size={15} />
          <span>Consultation Date: <strong>{formattedDate}</strong></span>
        </div>

        {diagnosis && (
          <div className="medical-record-card__section">
            <h4 className="medical-record-card__section-title">
              <Stethoscope size={16} /> Diagnosis
            </h4>
            <div className="medical-record-card__diagnosis-box">
              <p className="medical-record-card__primary-diagnosis">{diagnosis}</p>
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
              {prescriptions.map((med, idx) => (
                <div key={idx} className="prescription-pill">
                  <div className="prescription-pill__main">
                    <strong>{med.name}</strong>
                    <span className="prescription-pill__dosage">{med.dosage}</span>
                  </div>
                  <span className="prescription-pill__instructions">{med.instructions}</span>
                </div>
              ))}
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
