import { useState } from 'react';
import { Pencil, Calendar, Clock, Hash, Coffee } from 'lucide-react';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';
import WeeklyHoursForm from './WeeklyHoursForm';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Format a 24-hour "HH:MM" string to locale 12-hour display.
 */
function fmt(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Summarise working days: "Mon – Fri" when exactly 1-5, otherwise comma list.
 */
function summariseDays(days) {
  if (!days || days.length === 0) return '';
  const sorted = [...days].sort((a, b) => a - b);
  const isMonToFri =
    sorted.length === 5 &&
    sorted[0] === 1 && sorted[1] === 2 && sorted[2] === 3 &&
    sorted[3] === 4 && sorted[4] === 5;
  if (isMonToFri) return 'Mon – Fri';
  return sorted.map(d => DAY_LABELS[d]).join(', ');
}

/**
 * Card for viewing/editing the doctor's weekly hours.
 *
 * @param {{
 *   schedule: object,
 *   onSave: (payload: object) => Promise<void>,
 * }} props
 */
export default function WeeklyHoursCard({ schedule, onSave }) {
  const [editing, setEditing] = useState(false);

  if (!schedule) return null;

  const { workingDays, workingHours, slotDurationMinutes, breakTime } = schedule;
  const hasDays = workingDays && workingDays.length > 0;

  const hoursStr = `${fmt(workingHours?.start)} – ${fmt(workingHours?.end)}`;
  const breakStr =
    breakTime?.start && breakTime?.end
      ? `${fmt(breakTime.start)} – ${fmt(breakTime.end)}`
      : 'No break';

  async function handleSave(payload) {
    await onSave(payload);
    setEditing(false);
  }

  // Empty state: no working days
  if (!hasDays && !editing) {
    return (
      <Card>
        <EmptyState
          icon={Calendar}
          title="No working days set"
          description="Choose your working days and hours to open times for patients."
          action={
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setEditing(true)}
            >
              Edit hours
            </button>
          }
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="sch2-wh">
        {/* Header */}
        <div className="sch2-wh__header">
          <div>
            <h2>Your weekly hours</h2>
            <p className="sch2-wh__sub">Patients can book you during these times.</p>
          </div>
          {!editing && (
            <button
              type="button"
              className="button button--secondary sch2-wh__edit-btn"
              onClick={() => setEditing(true)}
            >
              <Pencil size={15} aria-hidden="true" />
              Edit hours
            </button>
          )}
        </div>

        {/* Body */}
        <div className="sch2-wh__body">
          {editing ? (
            <WeeklyHoursForm
              schedule={schedule}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <div className="sch2-wh__facts">
              <div className="sch2-wh__fact">
                <Calendar size={16} aria-hidden="true" className="sch2-wh__fact-icon" />
                <span className="sch2-wh__fact-label">Working days</span>
                <span className="sch2-wh__fact-value">{summariseDays(workingDays)}</span>
              </div>
              <div className="sch2-wh__fact">
                <Clock size={16} aria-hidden="true" className="sch2-wh__fact-icon" />
                <span className="sch2-wh__fact-label">Hours</span>
                <span className="sch2-wh__fact-value">{hoursStr}</span>
              </div>
              <div className="sch2-wh__fact">
                <Hash size={16} aria-hidden="true" className="sch2-wh__fact-icon" />
                <span className="sch2-wh__fact-label">Visit length</span>
                <span className="sch2-wh__fact-value">{slotDurationMinutes} minutes</span>
              </div>
              <div className="sch2-wh__fact">
                <Coffee size={16} aria-hidden="true" className="sch2-wh__fact-icon" />
                <span className="sch2-wh__fact-label">Break</span>
                <span className="sch2-wh__fact-value">{breakStr}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
