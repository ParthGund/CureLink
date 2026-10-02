import { CheckCircle2, Printer, CalendarDays, Activity, Pill, Stethoscope, Hourglass, Clock, Moon, Info } from 'lucide-react';
import { durationLabel, daysLeft } from '../../utils/formatMedicine';
import Card from '../common/Card';


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
              <Pill size={16} /> Prescribed in this visit
            </h4>
            <div className="medical-record-card__prescriptions">
              {prescriptions.map((med, idx) => {
                const durLabel = durationLabel(med);
                const hasFreq = !!med.frequency;
                const hasDosage = !!med.dosage;
                const hasDur = !!durLabel;

                // Status chip logic
                let chipText = '';
                let chipClass = '';
                if (med.isActive && med.endsOn) {
                  const dl = daysLeft(med.endsOn);
                  if (dl === 0) {
                    chipText = 'Ends today';
                    chipClass = 'mh-med-chip--amber';
                  } else if (dl === 1) {
                    chipText = 'Ends tomorrow';
                    chipClass = 'mh-med-chip--amber';
                  } else {
                    chipText = `${dl} days left`;
                    chipClass = 'mh-med-chip--teal';
                  }
                }

                const freqIcon = hasFreq && /night/i.test(med.frequency)
                  ? <Moon size={14} aria-hidden="true" />
                  : <Clock size={14} aria-hidden="true" />;

                return (
                  <div key={idx} className="mh-med-rx">
                    <div className="mh-med-rx__top">
                      <span className="mh-med-rx__name">{med.name}</span>
                      {chipText && (
                        <span className={`mh-med-chip ${chipClass}`}>{chipText}</span>
                      )}
                    </div>

                    {(hasDosage || hasFreq || hasDur) && (
                      <div className="mh-med-tiles">
                        {hasDosage && (
                          <div className="mh-med-tile">
                            <span className="mh-med-tile__label">
                              <Pill size={13} aria-hidden="true" /> How much
                            </span>
                            <span className="mh-med-tile__value">{med.dosage}</span>
                          </div>
                        )}
                        {hasFreq && (
                          <div className="mh-med-tile">
                            <span className="mh-med-tile__label">
                              {freqIcon} When
                            </span>
                            <span className="mh-med-tile__value">{med.frequency}</span>
                          </div>
                        )}
                        {hasDur && (
                          <div className="mh-med-tile">
                            <span className="mh-med-tile__label">
                              <Hourglass size={13} aria-hidden="true" /> For how long
                            </span>
                            <span className="mh-med-tile__value">{durLabel}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {med.instructions && (
                      <div className="mh-med-note">
                        <div className="mh-med-note__label">
                          <Info size={14} aria-hidden="true" />
                          <span>Doctor's note</span>
                        </div>
                        <p className="mh-med-note__text">{med.instructions}</p>
                      </div>
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
