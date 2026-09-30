import { Printer } from 'lucide-react';
import PrescriptionSheet from './PrescriptionSheet';

/**
 * Review step: shows the prescription sheet preview and
 * an inline notice if diagnosis is missing.
 *
 * @param {object}   props
 * @param {string}   props.patientName    - Patient full name.
 * @param {string}   props.doctorName     - Doctor name.
 * @param {string}   props.doctorSpec     - Doctor specialization.
 * @param {string}   props.date           - Completed date or placeholder.
 * @param {string}   props.chiefComplaint - Chief complaint text.
 * @param {string}   props.diagnosis      - Diagnosis text.
 * @param {object[]} props.items          - Current medicine items.
 * @param {boolean}  props.isCompleted    - Whether the consultation is completed.
 * @param {boolean}  props.canPrint       - Whether print is available.
 * @param {function} props.onPrint        - Called to trigger print.
 */
export default function ReviewStep({
  patientName,
  doctorName,
  doctorSpec,
  date,
  chiefComplaint,
  diagnosis,
  items,
  isCompleted,
  canPrint,
  onPrint,
}) {
  const needsDiagnosis = !isCompleted && !diagnosis.trim();

  return (
    <div className="dr-consult-review">
      {needsDiagnosis && (
        <p className="auth-error">Add a diagnosis before completing.</p>
      )}

      {isCompleted && (
        <p className="dr-consult-review__completed-note">
          This consultation is completed and can no longer be edited.
        </p>
      )}

      {canPrint && (
        <div className="dr-consult-review__print-row">
          <button type="button" className="button button--secondary" onClick={onPrint}>
            <Printer size={15} aria-hidden="true" /> Print prescription
          </button>
        </div>
      )}

      <PrescriptionSheet
        patientName={patientName}
        doctorName={doctorName}
        doctorSpec={doctorSpec}
        date={date}
        chiefComplaint={chiefComplaint}
        diagnosis={diagnosis}
        items={items}
      />
    </div>
  );
}
