import { Pill, Info } from 'lucide-react';
import { buildSentenceParts, daysLeft, formatEndDate } from '../../utils/formatMedicine';

const CIRCUMFERENCE = 251.3; // 2 * π * 40

/**
 * Countdown ring SVG for a medicine card.
 * Shows days remaining with a circular progress arc.
 */
function CountdownRing({ med }) {
  const dl = daysLeft(med.endsOn);
  const total = med.durationDays;
  const hasDuration = typeof total === 'number' && total > 0;

  const fraction = hasDuration ? Math.min(Math.max(dl / total, 0), 1) : 1;
  const offset = CIRCUMFERENCE * (1 - fraction);

  let centreLabel;
  if (dl === 0) {
    centreLabel = 'Ends today';
  } else {
    centreLabel = (
      <>
        <tspan x="48" dy="-4" className="mh-med-ring__number">{dl}</tspan>
        <tspan x="48" dy="16" className="mh-med-ring__unit">
          {dl === 1 ? 'day left' : 'days left'}
        </tspan>
      </>
    );
  }

  return (
    <svg
      className="mh-med-ring"
      viewBox="0 0 96 96"
      width="96"
      height="96"
      aria-hidden="true"
    >
      {/* Track */}
      <circle
        cx="48" cy="48" r="40"
        fill="none"
        stroke="var(--soft-blue)"
        strokeWidth="10"
      />
      {/* Arc (only when durationDays is available) */}
      {hasDuration && (
        <circle
          cx="48" cy="48" r="40"
          fill="none"
          stroke="var(--teal)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      )}
      <text
        x="48" y="48"
        textAnchor="middle"
        dominantBaseline="central"
        className="mh-med-ring__text"
      >
        {dl === 0 ? (
          <tspan className="mh-med-ring__ends-today">Ends today</tspan>
        ) : (
          centreLabel
        )}
      </text>
    </svg>
  );
}

/**
 * A single medicine card in the active medicines grid.
 */
function MedicineCard({ med }) {
  const parts = buildSentenceParts(med);
  const endDate = formatEndDate(med.endsOn);
  const doctorName = med.doctor?.name || '';

  return (
    <div className="mh-med-card">
      <div className="mh-med-card__top">
        <CountdownRing med={med} />
        <div className="mh-med-card__info">
          <span className="mh-med-card__name">{med.medicine}</span>
          {parts.length > 0 && (
            <span className="mh-med-card__sentence">
              {parts.map((p, i) => (
                <span key={i}>
                  {i > 0 && ', '}
                  {p.strong ? (
                    <strong className="mh-med-card__strong">{p.text}</strong>
                  ) : (
                    p.text
                  )}
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {med.instructions && (
        <div className="mh-med-note">
          <div className="mh-med-note__label">
            <Info size={14} aria-hidden="true" />
            <span>Doctor's note</span>
          </div>
          <p className="mh-med-note__text">{med.instructions}</p>
        </div>
      )}

      {(endDate || doctorName) && (
        <div className="mh-med-card__footer">
          {endDate && <span>Ends {endDate}</span>}
          {doctorName && <span>{doctorName}</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Displays the patient's currently active medicines as countdown-ring cards.
 * Rendered only when `medicines` has at least one item.
 *
 * @param {{ medicines: object[] }} props
 */
export default function ActiveMedicinesPanel({ medicines }) {
  if (!medicines || medicines.length === 0) return null;

  return (
    <div className="mh-med-panel">
      <div className="mh-med-panel__header">
        <div className="mh-med-panel__title">
          <Pill size={18} aria-hidden="true" />
          <h2>Medicines you're taking now</h2>
        </div>
        <span className="mh-active-panel__count">{medicines.length}</span>
      </div>
      <div className="mh-med-grid">
        {medicines.map((med, idx) => (
          <MedicineCard key={idx} med={med} />
        ))}
      </div>
    </div>
  );
}
