import { Trash2 } from 'lucide-react';

const FREQUENCY_CHIPS = ['Once daily', 'Twice daily', 'Three times daily', 'At night'];

/**
 * A single medicine card within the prescriptions step.
 *
 * @param {object}   props
 * @param {number}   props.index    - 0-based index of this medicine.
 * @param {object}   props.item     - The medicine item state.
 * @param {function} props.onChange  - Called with (index, field, value).
 * @param {function} props.onRemove - Called with (index).
 */
export default function MedicineCard({ index, item, onChange, onRemove, readOnly }) {
  function handleFrequencyChip(chip) {
    onChange(index, 'frequency', chip);
  }

  return (
    <div className="dr-consult-med">
      <div className="dr-consult-med__header">
        <span className="dr-consult-med__badge">{index + 1}</span>
        <span className="dr-consult-med__title">Medicine</span>
        {!readOnly && (
          <button
            type="button"
            className="dr-consult-med__remove"
            onClick={() => onRemove(index)}
            aria-label="Remove medicine"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="dr-consult-med__body">
        <div className="dr-consult-med__row">
          <div className="dr-consult-med__field dr-consult-med__field--wide">
            <label htmlFor={`med-name-${index}`} className="dr-consult-med__label">
              Medicine name <span className="dr-consult-med__req">*</span>
            </label>
            <input
              id={`med-name-${index}`}
              type="text"
              className="dr-consult-med__input"
              placeholder="e.g. Amoxicillin 500mg"
              value={item.medicine}
              onChange={(e) => onChange(index, 'medicine', e.target.value)}
              maxLength={100}
              disabled={readOnly}
            />
          </div>
          <div className="dr-consult-med__field">
            <label htmlFor={`med-dosage-${index}`} className="dr-consult-med__label">Dosage</label>
            <input
              id={`med-dosage-${index}`}
              type="text"
              className="dr-consult-med__input"
              placeholder="e.g. 1 tablet"
              value={item.dosage}
              onChange={(e) => onChange(index, 'dosage', e.target.value)}
              maxLength={100}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="dr-consult-med__chips">
          {FREQUENCY_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className={`dr-consult-med__chip ${item.frequency === chip ? 'dr-consult-med__chip--active' : ''}`}
              onClick={() => handleFrequencyChip(chip)}
              disabled={readOnly}
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="dr-consult-med__row dr-consult-med__row--three">
          <div className="dr-consult-med__field">
            <label htmlFor={`med-freq-${index}`} className="dr-consult-med__label">Frequency</label>
            <input
              id={`med-freq-${index}`}
              type="text"
              className="dr-consult-med__input"
              placeholder="e.g. Twice daily"
              value={item.frequency}
              onChange={(e) => onChange(index, 'frequency', e.target.value)}
              maxLength={100}
              disabled={readOnly}
            />
          </div>
          <div className="dr-consult-med__field">
            <label htmlFor={`med-dur-${index}`} className="dr-consult-med__label">Duration</label>
            <input
              id={`med-dur-${index}`}
              type="text"
              className="dr-consult-med__input"
              placeholder="e.g. 5 days"
              value={item.duration}
              onChange={(e) => onChange(index, 'duration', e.target.value)}
              maxLength={100}
              disabled={readOnly}
            />
          </div>
          <div className="dr-consult-med__field">
            <label htmlFor={`med-days-${index}`} className="dr-consult-med__label">Days active</label>
            <input
              id={`med-days-${index}`}
              type="number"
              className="dr-consult-med__input"
              placeholder="e.g. 5"
              value={item.durationDays}
              onChange={(e) => onChange(index, 'durationDays', e.target.value)}
              min={1}
              max={365}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="dr-consult-med__field">
          <label htmlFor={`med-instr-${index}`} className="dr-consult-med__label">Instructions</label>
          <input
            id={`med-instr-${index}`}
            type="text"
            className="dr-consult-med__input"
            placeholder="e.g. Take after meals"
            value={item.instructions}
            onChange={(e) => onChange(index, 'instructions', e.target.value)}
            maxLength={300}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
}
