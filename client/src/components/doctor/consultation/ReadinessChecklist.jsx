import { Check } from 'lucide-react';

/**
 * Readiness checklist shown in the patient panel for in-progress consultations.
 * Ticks update live as the doctor types.
 *
 * @param {object}  props
 * @param {boolean} props.hasDiagnosis - Diagnosis is non-empty.
 * @param {boolean} props.hasComplaint - Chief complaint is non-empty (optional).
 * @param {boolean} props.hasMedicines - At least one medicine has a name (optional).
 */
export default function ReadinessChecklist({ hasDiagnosis, hasComplaint, hasMedicines }) {
  const items = [
    { label: 'Diagnosis recorded', done: hasDiagnosis },
    { label: 'Chief complaint', done: hasComplaint },
    { label: 'Medicines', done: hasMedicines },
  ];

  return (
    <div className="dr-consult-checklist">
      <span className="dr-consult-checklist__heading">Before you complete</span>
      <ul className="dr-consult-checklist__list">
        {items.map((item) => (
          <li key={item.label} className="dr-consult-checklist__item">
            <span className={`dr-consult-checklist__circle ${item.done ? 'dr-consult-checklist__circle--done' : ''}`}>
              {item.done && <Check size={11} aria-hidden="true" />}
            </span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
