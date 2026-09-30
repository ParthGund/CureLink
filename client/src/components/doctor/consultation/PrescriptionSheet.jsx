import { ShieldCheck } from 'lucide-react';

/**
 * Printable prescription sheet component.
 * Shows patient, doctor, date, chief complaint, diagnosis, and medicines.
 * Clinical notes are intentionally excluded (private).
 *
 * @param {object}   props
 * @param {string}   props.patientName      - Patient full name.
 * @param {string}   props.doctorName       - Doctor name.
 * @param {string}   props.doctorSpec       - Doctor specialization.
 * @param {string}   props.date             - Formatted completed date or placeholder.
 * @param {string}   props.chiefComplaint   - Chief complaint text.
 * @param {string}   props.diagnosis        - Diagnosis text.
 * @param {object[]} props.items            - Array of medicine items.
 */
export default function PrescriptionSheet({
  patientName,
  doctorName,
  doctorSpec,
  date,
  chiefComplaint,
  diagnosis,
  items,
}) {
  return (
    <div className="dr-consult-sheet">
      <div className="dr-consult-sheet__header">
        <span className="dr-consult-sheet__brand">
          <ShieldCheck size={18} aria-hidden="true" />
          CureLink
        </span>
        <span className="dr-consult-sheet__label">Prescription</span>
      </div>
      <div className="dr-consult-sheet__rule" />

      <div className="dr-consult-sheet__body">
        <div className="dr-consult-sheet__meta">
          <div className="dr-consult-sheet__meta-item">
            <span className="dr-consult-sheet__meta-label">Patient</span>
            <span className="dr-consult-sheet__meta-value">{patientName || 'Not recorded'}</span>
          </div>
          <div className="dr-consult-sheet__meta-item">
            <span className="dr-consult-sheet__meta-label">Doctor</span>
            <span className="dr-consult-sheet__meta-value">
              {doctorName || 'Not recorded'}
              {doctorSpec && <span className="dr-consult-sheet__meta-spec"> · {doctorSpec}</span>}
            </span>
          </div>
          <div className="dr-consult-sheet__meta-item">
            <span className="dr-consult-sheet__meta-label">Date</span>
            <span className="dr-consult-sheet__meta-value">{date || 'Not completed yet'}</span>
          </div>
        </div>

        {(chiefComplaint || diagnosis) && (
          <div className="dr-consult-sheet__clinical">
            {chiefComplaint && (
              <div className="dr-consult-sheet__meta-item">
                <span className="dr-consult-sheet__meta-label">Chief complaint</span>
                <span className="dr-consult-sheet__meta-value">{chiefComplaint}</span>
              </div>
            )}
            {diagnosis && (
              <div className="dr-consult-sheet__meta-item">
                <span className="dr-consult-sheet__meta-label">Diagnosis</span>
                <span className="dr-consult-sheet__meta-value">{diagnosis}</span>
              </div>
            )}
          </div>
        )}

        <div className="dr-consult-sheet__meds">
          <span className="dr-consult-sheet__meta-label">Medicines</span>
          {items && items.length > 0 ? (
            <ol className="dr-consult-sheet__med-list">
              {items.map((item, i) => (
                <li key={i} className="dr-consult-sheet__med-item">
                  <span className="dr-consult-sheet__med-name">{item.medicine || 'Not recorded'}</span>
                  <span className="dr-consult-sheet__med-detail">
                    {[item.dosage, item.frequency, item.durationDays ? `${item.durationDays} days` : item.duration]
                      .filter(Boolean)
                      .join(' · ') || ''}
                  </span>
                  {item.instructions && (
                    <span className="dr-consult-sheet__med-instr">{item.instructions}</span>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="dr-consult-sheet__no-meds">No medicines prescribed.</p>
          )}
        </div>
      </div>
    </div>
  );
}
