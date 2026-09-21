import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTodayIso } from '../../utils/dateUtils';

const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Build a Date from a "YYYY-MM-DD" string using local parts.
 */
function localDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a Date as "Sep 21".
 */
function shortMonth(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Determine the status line for a day given its slots.
 * @returns {string} "N open" | "Full" | "Day off"
 */
function dayStatus(daySlots) {
  if (daySlots.length === 0) return 'Day off';
  const openCount = daySlots.filter(s => s.status === 'open' && !s.isBooked).length;
  if (openCount > 0) return `${openCount} open`;
  const bookedCount = daySlots.filter(s => s.isBooked).length;
  if (bookedCount > 0) return 'Full';
  return 'Day off';
}

/**
 * Presentational day picker — 7-day strip with paging.
 *
 * @param {{
 *   dates: string[],
 *   slots: Array,
 *   workingDays: number[],
 *   selectedDate: string,
 *   onSelect: (date: string) => void,
 *   page: number,
 *   onPageChange: (page: number) => void,
 * }} props
 */
export default function ScheduleDayPicker({
  dates,
  slots,
  workingDays,
  selectedDate,
  onSelect,
  page,
  onPageChange,
}) {
  const today = getTodayIso();
  const pageSize = 7;
  const totalPages = Math.ceil(dates.length / pageSize);
  const visibleDates = dates.slice(page * pageSize, (page + 1) * pageSize);

  const rangeStart = visibleDates[0] ? localDate(visibleDates[0]) : null;
  const rangeEnd = visibleDates[visibleDates.length - 1]
    ? localDate(visibleDates[visibleDates.length - 1])
    : null;
  const rangeLabel =
    rangeStart && rangeEnd
      ? `${shortMonth(rangeStart)} – ${shortMonth(rangeEnd)}`
      : '';

  return (
    <div className="sch2-picker">
      <div className="sch2-picker__header">
        <h2>Upcoming days</h2>
        <div className="sch2-picker__nav">
          <span className="sch2-picker__range">{rangeLabel}</span>
          <button
            type="button"
            className="sch2-picker__arrow"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            aria-label="Previous week"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="sch2-picker__arrow"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            aria-label="Next week"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="sch2-picker__strip" role="tablist">
        {visibleDates.map(dateStr => {
          const dateObj = localDate(dateStr);
          const dayNum = dateObj.getDay();
          const isWorking = workingDays.includes(dayNum);
          const daySlots = slots.filter(s => s.date === dateStr);
          const status = dayStatus(daySlots);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;

          return (
            <button
              key={dateStr}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={
                'sch2-day' +
                (isSelected ? ' sch2-day--sel' : '') +
                (!isWorking ? ' sch2-day--muted' : '')
              }
              onClick={() => onSelect(dateStr)}
            >
              <span className="sch2-day__label">
                {isToday ? 'Today' : SHORT_DAYS[dayNum]}
              </span>
              <span className="sch2-day__num">{dateObj.getDate()}</span>
              <span
                className={
                  'sch2-day__status' +
                  (status === 'Day off' ? ' sch2-day__status--off' : '') +
                  (status === 'Full' ? ' sch2-day__status--full' : '')
                }
              >
                {status}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
