import { Stethoscope, ClipboardList, NotebookPen, Lock, HeartPulse, CalendarClock, FileText } from 'lucide-react';

/**
 * Assessment step: chief complaint, diagnosis, clinical notes,
 * treatment plan, follow-up date, and follow-up instructions fields.
 *
 * @param {object}   props
 * @param {string}   props.chiefComplaint        - Current chief complaint value.
 * @param {string}   props.diagnosis              - Current diagnosis value.
 * @param {string}   props.clinicalNotes          - Current clinical notes value.
 * @param {string}   props.treatmentPlan          - Current treatment plan value.
 * @param {string}   props.followUpDate           - Current follow-up date (YYYY-MM-DD string).
 * @param {string}   props.followUpInstructions   - Current follow-up instructions value.
 * @param {function} props.onChange               - Called with (field, value).
 * @param {boolean}  props.readOnly               - Whether the consultation is completed.
 */
export default function AssessmentStep({
  chiefComplaint,
  diagnosis,
  clinicalNotes,
  treatmentPlan,
  followUpDate,
  followUpInstructions,
  onChange,
  readOnly,
}) {
  const diagnosisFilled = diagnosis.trim().length > 0;

  /** Format a YYYY-MM-DD string for display. */
  function formatDate(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (readOnly) {
    return (
      <div className="dr-consult-assessment">
        <div className="dr-consult-assessment__field">
          <div className="dr-consult-assessment__label-row">
            <label className="dr-consult-assessment__label">
              <Stethoscope size={15} aria-hidden="true" />
              Chief complaint
            </label>
          </div>
          <p className="dr-consult-assessment__readonly-value">
            {chiefComplaint || <span className="dr-consult-assessment__empty">Not recorded</span>}
          </p>
        </div>

        <div className="dr-consult-assessment__field">
          <div className="dr-consult-assessment__label-row">
            <label className="dr-consult-assessment__label">
              <ClipboardList size={15} aria-hidden="true" />
              Diagnosis
            </label>
          </div>
          <p className="dr-consult-assessment__readonly-value">
            {diagnosis || <span className="dr-consult-assessment__empty">Not recorded</span>}
          </p>
        </div>

        <div className="dr-consult-assessment__field">
          <div className="dr-consult-assessment__label-row">
            <label className="dr-consult-assessment__label">
              <NotebookPen size={15} aria-hidden="true" />
              Clinical notes
            </label>
            <span className="dr-consult-assessment__private">
              <Lock size={12} aria-hidden="true" /> Only you can see this
            </span>
          </div>
          <p className="dr-consult-assessment__readonly-value">
            {clinicalNotes || <span className="dr-consult-assessment__empty">Not recorded</span>}
          </p>
        </div>

        <div className="dr-consult-assessment__divider" />

        <div className="dr-consult-assessment__field">
          <div className="dr-consult-assessment__label-row">
            <label className="dr-consult-assessment__label">
              <HeartPulse size={15} aria-hidden="true" />
              Treatment plan
            </label>
          </div>
          <p className="dr-consult-assessment__readonly-value">
            {treatmentPlan || <span className="dr-consult-assessment__empty">Not recorded</span>}
          </p>
        </div>

        <div className="dr-consult-assessment__follow-up-row">
          <div className="dr-consult-assessment__field">
            <div className="dr-consult-assessment__label-row">
              <label className="dr-consult-assessment__label">
                <CalendarClock size={15} aria-hidden="true" />
                Follow-up date
              </label>
            </div>
            <p className="dr-consult-assessment__readonly-value">
              {formatDate(followUpDate) || <span className="dr-consult-assessment__empty">Not set</span>}
            </p>
          </div>

          <div className="dr-consult-assessment__field">
            <div className="dr-consult-assessment__label-row">
              <label className="dr-consult-assessment__label">
                <FileText size={15} aria-hidden="true" />
                Follow-up instructions
              </label>
            </div>
            <p className="dr-consult-assessment__readonly-value">
              {followUpInstructions || <span className="dr-consult-assessment__empty">Not recorded</span>}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dr-consult-assessment">
      <div className="dr-consult-assessment__field">
        <div className="dr-consult-assessment__label-row">
          <label htmlFor="chief-complaint" className="dr-consult-assessment__label">
            <Stethoscope size={15} aria-hidden="true" />
            Chief complaint
          </label>
          <span className="dr-consult-assessment__counter">
            {chiefComplaint.length} / 500
          </span>
        </div>
        <input
          id="chief-complaint"
          type="text"
          className="dr-consult-assessment__input"
          placeholder="What is the patient presenting with?"
          value={chiefComplaint}
          onChange={(e) => onChange('chiefComplaint', e.target.value)}
          maxLength={500}
        />
      </div>

      <div className="dr-consult-assessment__field">
        <div className="dr-consult-assessment__label-row">
          <label htmlFor="diagnosis" className="dr-consult-assessment__label">
            <ClipboardList size={15} aria-hidden="true" />
            Diagnosis
          </label>
          <span className={`dr-consult-assessment__hint ${diagnosisFilled ? 'dr-consult-assessment__hint--ok' : ''}`}>
            {diagnosisFilled ? 'Looks good' : 'Required to complete'}
          </span>
        </div>
        <input
          id="diagnosis"
          type="text"
          className="dr-consult-assessment__input"
          placeholder="Enter diagnosis"
          value={diagnosis}
          onChange={(e) => onChange('diagnosis', e.target.value)}
          maxLength={1000}
        />
      </div>

      <div className="dr-consult-assessment__field">
        <div className="dr-consult-assessment__label-row">
          <label htmlFor="clinical-notes" className="dr-consult-assessment__label">
            <NotebookPen size={15} aria-hidden="true" />
            Clinical notes
          </label>
          <span className="dr-consult-assessment__private">
            <Lock size={12} aria-hidden="true" /> Only you can see this
          </span>
        </div>
        <textarea
          id="clinical-notes"
          className="dr-consult-assessment__textarea"
          placeholder="Examination findings, observations, follow-up advice"
          value={clinicalNotes}
          onChange={(e) => onChange('clinicalNotes', e.target.value)}
          maxLength={2000}
          rows={4}
        />
      </div>

      <div className="dr-consult-assessment__divider" />

      <div className="dr-consult-assessment__field">
        <div className="dr-consult-assessment__label-row">
          <label htmlFor="treatment-plan" className="dr-consult-assessment__label">
            <HeartPulse size={15} aria-hidden="true" />
            Treatment plan
          </label>
          <span className="dr-consult-assessment__counter">
            {treatmentPlan.length} / 2000
          </span>
        </div>
        <textarea
          id="treatment-plan"
          className="dr-consult-assessment__textarea"
          placeholder="Outline the treatment plan for this patient"
          value={treatmentPlan}
          onChange={(e) => onChange('treatmentPlan', e.target.value)}
          maxLength={2000}
          rows={3}
        />
      </div>

      <div className="dr-consult-assessment__follow-up-row">
        <div className="dr-consult-assessment__field">
          <div className="dr-consult-assessment__label-row">
            <label htmlFor="follow-up-date" className="dr-consult-assessment__label">
              <CalendarClock size={15} aria-hidden="true" />
              Follow-up date
            </label>
          </div>
          <input
            id="follow-up-date"
            type="date"
            className="dr-consult-assessment__input"
            value={followUpDate}
            onChange={(e) => onChange('followUpDate', e.target.value)}
          />
        </div>

        <div className="dr-consult-assessment__field dr-consult-assessment__field--grow">
          <div className="dr-consult-assessment__label-row">
            <label htmlFor="follow-up-instructions" className="dr-consult-assessment__label">
              <FileText size={15} aria-hidden="true" />
              Follow-up instructions
            </label>
            <span className="dr-consult-assessment__counter">
              {followUpInstructions.length} / 1000
            </span>
          </div>
          <textarea
            id="follow-up-instructions"
            className="dr-consult-assessment__textarea"
            placeholder="Instructions for the patient's next visit"
            value={followUpInstructions}
            onChange={(e) => onChange('followUpInstructions', e.target.value)}
            maxLength={1000}
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
