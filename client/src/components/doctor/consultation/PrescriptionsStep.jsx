import { Plus, Pill, Printer } from 'lucide-react';
import MedicineCard from './MedicineCard';

/**
 * Prescriptions step: list of medicine cards with add/remove functionality.
 *
 * @param {object}   props
 * @param {object[]} props.items         - Array of medicine item states.
 * @param {function} props.onAdd         - Called to add a new empty medicine.
 * @param {function} props.onChange       - Called with (index, field, value).
 * @param {function} props.onRemove      - Called with (index).
 * @param {boolean}  props.canPrint      - Whether the print button should show.
 * @param {function} props.onPrint       - Called to trigger print.
 * @param {string}   [props.error]       - Inline error message.
 */
export default function PrescriptionsStep({
  items,
  onAdd,
  onChange,
  onRemove,
  canPrint,
  onPrint,
  error,
}) {
  return (
    <div className="dr-consult-rx">
      <div className="dr-consult-rx__header">
        <div>
          <h3 className="dr-consult-rx__title">Medicines</h3>
          <p className="dr-consult-rx__hint">
            Add days active so patients can see which medicines are current.
          </p>
        </div>
        <div className="dr-consult-rx__header-actions">
          {canPrint && (
            <button type="button" className="button button--secondary dr-consult-rx__print-btn" onClick={onPrint}>
              <Printer size={15} aria-hidden="true" /> Print prescription
            </button>
          )}
          <button
            type="button"
            className="button button--secondary"
            onClick={onAdd}
            disabled={items.length >= 20}
          >
            <Plus size={15} aria-hidden="true" /> Add medicine
          </button>
        </div>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {items.length === 0 ? (
        <div className="dr-consult-rx__empty">
          <span className="dr-consult-rx__empty-icon">
            <Pill size={24} aria-hidden="true" />
          </span>
          <h4>No medicines added</h4>
          <p>Add a medicine if this consultation needs a prescription.</p>
        </div>
      ) : (
        <div className="dr-consult-rx__list">
          {items.map((item, i) => (
            <MedicineCard
              key={item._key}
              index={i}
              item={item}
              onChange={onChange}
              onRemove={onRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
