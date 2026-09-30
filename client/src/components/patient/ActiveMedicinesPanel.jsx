import { Pill } from 'lucide-react';
import Card from '../common/Card';

/**
 * Format a date into a readable short string.
 */
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Displays the patient's currently active medicines.
 * Rendered only when `medicines` has at least one item.
 *
 * @param {{ medicines: object[] }} props
 */
export default function ActiveMedicinesPanel({ medicines }) {
  if (!medicines || medicines.length === 0) return null;

  return (
    <Card className="mh-active-panel">
      <div className="mh-active-panel__header">
        <div className="mh-active-panel__title">
          <Pill size={18} aria-hidden="true" />
          <h2>Active medicines</h2>
        </div>
        <span className="mh-active-panel__count">{medicines.length}</span>
      </div>
      <div className="mh-active-panel__list">
        {medicines.map((med, idx) => {
          const freqDur = [med.frequency, med.duration].filter(Boolean).join(' · ');
          const footer = [
            med.endsOn ? `Until ${formatDate(med.endsOn)}` : null,
            med.doctor?.name || null,
          ].filter(Boolean).join(' · ');

          return (
            <div key={idx} className="prescription-pill">
              <div className="prescription-pill__main">
                <strong>{med.medicine}</strong>
                {med.dosage && <span className="prescription-pill__dosage">{med.dosage}</span>}
              </div>
              {freqDur && <span className="mh-pill-freq">{freqDur}</span>}
              {med.instructions && (
                <span className="prescription-pill__instructions">{med.instructions}</span>
              )}
              {footer && <span className="mh-pill-footer">{footer}</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
