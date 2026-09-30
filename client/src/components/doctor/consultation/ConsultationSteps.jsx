import { Check } from 'lucide-react';

/**
 * Three-step tracker for the consultation workspace.
 *
 * @param {object}   props
 * @param {number}   props.active        - Index of the active step (0, 1, 2).
 * @param {function} props.onSelect      - Called with the step index.
 * @param {boolean}  props.assessmentDone - Whether diagnosis is non-empty.
 * @param {boolean}  props.prescriptionsDone - Whether at least one named medicine exists.
 * @param {number}   props.medicineCount - Number of medicines with a name.
 */
export default function ConsultationSteps({
  active,
  onSelect,
  assessmentDone,
  prescriptionsDone,
  medicineCount,
}) {
  const steps = [
    { label: 'Assessment', sub: 'Findings and notes', done: assessmentDone },
    { label: 'Prescriptions', sub: 'Medicines', done: prescriptionsDone, count: medicineCount },
    { label: 'Review', sub: 'Check and complete', done: false },
  ];

  return (
    <div className="dr-consult-steps" role="tablist" aria-label="Consultation steps">
      {steps.map((step, i) => {
        const isActive = active === i;
        const cls = [
          'dr-consult-step',
          isActive ? 'dr-consult-step--active' : '',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cls}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') onSelect(Math.min(2, i + 1));
              if (e.key === 'ArrowLeft') onSelect(Math.max(0, i - 1));
            }}
            tabIndex={isActive ? 0 : -1}
          >
            <span className={`dr-consult-step__num ${step.done ? 'dr-consult-step__num--done' : ''}`}>
              {step.done ? <Check size={14} aria-hidden="true" /> : i + 1}
            </span>
            <span className="dr-consult-step__text">
              <span className="dr-consult-step__label">
                {step.label}
                {step.count > 0 && (
                  <span className="dr-consult-step__count">{step.count}</span>
                )}
              </span>
              <span className="dr-consult-step__sub">{step.sub}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
