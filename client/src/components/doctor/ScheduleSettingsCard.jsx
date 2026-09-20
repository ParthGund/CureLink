import { Clock, Calendar, Hash, Coffee } from 'lucide-react';
import Card from '../common/Card';
import EmptyState from '../common/EmptyState';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleSettingsCard({ schedule, onEdit }) {
  if (!schedule) return null;

  const { workingDays, workingHours, slotDurationMinutes, breakTime } = schedule;

  if (!workingDays || workingDays.length === 0) {
    return (
      <Card className="schedule-settings-card">
        <EmptyState
          icon={Calendar}
          title="No working days set"
          description="Choose your working days and hours to open times for patients."
          action={<button type="button" className="button button--secondary" onClick={onEdit}>Edit schedule</button>}
        />
      </Card>
    );
  }

  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const hoursStr = `${formatTime(workingHours?.start)} – ${formatTime(workingHours?.end)}`;
  const breakStr = breakTime?.start && breakTime?.end 
    ? `${formatTime(breakTime.start)} – ${formatTime(breakTime.end)}` 
    : 'No break';

  return (
    <Card className="schedule-settings-card">
      <div className="schedule-card__header">
        <div style={{ flex: 1 }}>
          <h2>Working schedule</h2>
          <p className="schedule-card__sub">Your weekly hours. Changing them updates your upcoming open times.</p>
        </div>
        <button type="button" className="button button--secondary" onClick={onEdit}>
          Edit schedule
        </button>
      </div>
      <div className="schedule-card__body">
        <div className="schedule-settings-grid">
          <div className="schedule-setting-item">
            <span className="schedule-setting-label"><Calendar size={16} /> Days</span>
            <div className="schedule-setting-chips">
              {DAY_LABELS.map((label, i) => {
                const isActive = workingDays.includes(i);
                return (
                  <span key={i} className={`schedule-day-chip ${isActive ? 'schedule-day-chip--active' : ''}`}>
                    {label}
                  </span>
                );
              })}
            </div>
          </div>
          <div className="schedule-setting-item">
            <span className="schedule-setting-label"><Clock size={16} /> Hours</span>
            <span className="schedule-setting-value">{hoursStr}</span>
          </div>
          <div className="schedule-setting-item">
            <span className="schedule-setting-label"><Hash size={16} /> Slot length</span>
            <span className="schedule-setting-value">{slotDurationMinutes} minutes</span>
          </div>
          <div className="schedule-setting-item">
            <span className="schedule-setting-label"><Coffee size={16} /> Break</span>
            <span className="schedule-setting-value">{breakStr}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
