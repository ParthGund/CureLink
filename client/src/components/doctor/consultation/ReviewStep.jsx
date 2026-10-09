import { Printer, HeartPulse, CalendarClock, FileText } from 'lucide-react';
import PrescriptionSheet from './PrescriptionSheet';

/**
 * Review step: shows the prescription sheet preview, treatment plan,
 * follow-up details, and an inline notice if diagnosis is missing.
 *
 * @param {object}   props
 * @param {string}   props.patientName          - Patient full name.
 * @param {string}   props.doctorName           - Doctor name.
 * @param {string}   props.doctorSpec           - Doctor specialization.
 * @param {string}   props.date                 - Completed date or placeholder.
 * @param {string}   props.chiefComplaint       - Chief complaint text.
 * @param {string}   props.diagnosis            - Diagnosis text.
 * @param {string}   props.treatmentPlan        - Treatment plan text.
 * @param {string}   props.followUpDate         - Follow-up date (YYYY-MM-DD or ISO).
 * @param {string}   props.followUpInstructions - Follow-up instructions text.
 * @param {object[]} props.items                - Current medicine items.
 * @param {boolean}  props.isCompleted          - Whether the consultation is completed.
 * @param {boolean}  props.canPrint             - Whether print is available.
 * @param {function} props.onPrint              - Called to trigger print.
 */
export default function ReviewStep({
  patientName,
  doctorName,
  doctorSpec,
  date,
  chiefComplaint,
  diagnosis,
  treatmentPlan,
  followUpDate,
  followUpInstructions,
  items,
  isCompleted,
  canPrint,
  onPrint,
}) {
  const needsDiagnosis = !isCompleted && !diagnosis.trim();

  /** Format a date string for display. */
  function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const hasFollowUp = followUpDate || (followUpInstructions && followUpInstructions.trim());

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

      {/* Treatment plan summary */}
      {treatmentPlan && treatmentPlan.trim() && (
        <div className="dr-consult-review__section">
          <h4 className="dr-consult-review__section-title">
            <HeartPulse size={15} aria-hidden="true" />
            Treatment Plan
          </h4>
          <p className="dr-consult-review__section-text">{treatmentPlan}</p>
        </div>
      )}

      {/* Follow-up summary */}
      {hasFollowUp && (
        <div className="dr-consult-review__section">
          <h4 className="dr-consult-review__section-title">
            <CalendarClock size={15} aria-hidden="true" />
            Follow-up
          </h4>
          <div className="dr-consult-review__follow-up">
            {followUpDate && (
              <div className="dr-consult-review__follow-up-item">
                <span className="dr-consult-review__follow-up-label">Date</span>
                <span className="dr-consult-review__follow-up-value">{formatDate(followUpDate)}</span>
              </div>
            )}
            {followUpInstructions && followUpInstructions.trim() && (
              <div className="dr-consult-review__follow-up-item">
                <span className="dr-consult-review__follow-up-label">
                  <FileText size={13} aria-hidden="true" /> Instructions
                </span>
                <p className="dr-consult-review__follow-up-value">{followUpInstructions}</p>
              </div>
            )}
          </div>
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
