import { Stethoscope, ClipboardList, NotebookPen, Lock } from 'lucide-react';

/**
 * Assessment step: chief complaint, diagnosis, and clinical notes fields.
 *
 * @param {object}   props
 * @param {string}   props.chiefComplaint - Current chief complaint value.
 * @param {string}   props.diagnosis      - Current diagnosis value.
 * @param {string}   props.clinicalNotes  - Current clinical notes value.
 * @param {function} props.onChange       - Called with (field, value).
 * @param {boolean}  props.readOnly       - Whether the consultation is completed.
 */
export default function AssessmentStep({
  chiefComplaint,
  diagnosis,
  clinicalNotes,
  onChange,
  readOnly,
}) {
  const diagnosisFilled = diagnosis.trim().length > 0;

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
    </div>
  );
}
