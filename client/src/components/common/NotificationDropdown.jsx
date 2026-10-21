import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CalendarClock, AlertTriangle, Clock, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getMyAppointments, getDoctorAppointments } from '../../services/appointmentService';

/* ── Date and time helpers ────────────────────────────────────── */

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

function parseDateOnly(raw) {
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof raw === 'string') {
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return new Date(Number(y), Number(m) - 1, Number(d));
    }
  }
  const parsed = new Date(raw);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function parseSlotMinutes(slot) {
  if (typeof slot !== 'string') return 0;
  const match = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return 0;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return h * 60 + m;
}

function getAptDateTime(apt) {
  const raw = apt.appointmentDate || apt.date;
  const base = parseDateOnly(raw);
  if (!base) return null;
  const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (apt.timeSlot) {
    const mins = parseSlotMinutes(apt.timeSlot);
    dt.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  }
  return dt;
}

/**
 * Format date as short human-readable label: "Today", "Tomorrow", or "Mon, Oct 21".
 */
function friendlyDate(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = target.getTime() - today.getTime();

  if (diff === 0) return 'Today';
  if (diff === 86400000) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/* ── Notification derivation ──────────────────────────────────── */

/**
 * Build notification items from raw appointments.
 *
 * Categories:
 *   1. "missed"   → appointments marked as missed
 *   2. "today"    → active appointments scheduled for today
 *   3. "upcoming" → active appointments scheduled for tomorrow or within 48h
 */
function deriveNotifications(appointments, role) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const items = [];

  for (const apt of appointments) {
    const aptDt = getAptDateTime(apt);
    if (!aptDt) continue;

    const targetDay = new Date(aptDt.getFullYear(), aptDt.getMonth(), aptDt.getDate());
    const dayDiff = targetDay.getTime() - today.getTime();

    // Determine other party display name based on role
    const otherParty = role === 'doctor'
      ? (apt.patient?.fullName || apt.patient?.name || 'Patient')
      : (apt.doctor?.name ? (apt.doctor.name.startsWith('Dr.') ? apt.doctor.name : `Dr. ${apt.doctor.name}`) : 'your doctor');

    const timeSlot = apt.timeSlot ? ` · ${apt.timeSlot}` : '';

    // Missed
    if (apt.status === 'missed') {
      items.push({
        id: `missed-${apt._id}`,
        type: 'missed',
        icon: AlertTriangle,
        title: 'Missed appointment',
        body: `${otherParty}${timeSlot}`,
        date: friendlyDate(aptDt),
        aptId: apt._id,
        timestamp: aptDt.getTime(),
      });
      continue;
    }

    // Active upcoming statuses
    const active = apt.status === 'scheduled' || apt.status === 'confirmed' || apt.status === 'upcoming';
    const msDiff = aptDt.getTime() - now.getTime();

    // Within today or upcoming within 48 hours
    if (active && (dayDiff === 0 || (msDiff > 0 && msDiff <= FORTY_EIGHT_HOURS_MS))) {
      const isToday = dayDiff === 0;
      items.push({
        id: `soon-${apt._id}`,
        type: isToday ? 'today' : 'upcoming',
        icon: isToday ? Clock : CalendarClock,
        title: isToday ? 'Appointment today' : 'Upcoming appointment',
        body: `${otherParty}${timeSlot}`,
        date: friendlyDate(aptDt),
        aptId: apt._id,
        timestamp: aptDt.getTime(),
      });
    }
  }

  // Sort: today/missed first, then by timestamp ascending
  const priority = { today: 0, missed: 1, upcoming: 2 };
  items.sort((a, b) => (priority[a.type] ?? 9) - (priority[b.type] ?? 9) || a.timestamp - b.timestamp);

  return items;
}

/* ── Component ────────────────────────────────────────────────── */

/**
 * Notification bell button + dropdown panel.
 *
 * Fetches the authenticated user's appointments on mount and
 * derives smart notification items (within 24-48 hours and missed).
 */
export default function NotificationDropdown() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem('notif_dismissed') || '[]'));
    } catch {
      return new Set();
    }
  });
  const ref = useRef(null);

  // Persist dismissed set for the session
  const dismiss = useCallback((id) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      sessionStorage.setItem('notif_dismissed', JSON.stringify([...next]));
      return next;
    });
  }, []);

  // Fetch appointments & derive notifications
  useEffect(() => {
    if (!user) return;

    const fetcher = user.role === 'doctor' ? getDoctorAppointments : getMyAppointments;

    fetcher()
      .then((data) => {
        const list = data.appointments ?? [];
        setItems(deriveNotifications(list, user.role));
      })
      .catch(() => setItems([]));
  }, [user]);

  // Click-outside close & Escape key handling
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function handleItemClick() {
    setOpen(false);
    const destination = user?.role === 'doctor' ? '/doctor/appointments' : '/patient/appointments';
    navigate(destination);
  }

  const visible = items.filter((i) => !dismissed.has(i.id));
  const count = visible.length;

  return (
    <div className="notif-dropdown" ref={ref}>
      <button
        type="button"
        className="icon-button notif-dropdown__trigger"
        aria-label={`Notifications${count > 0 ? ` (${count} new)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={19} />
        {count > 0 && <span className="notif-dropdown__badge">{count > 9 ? '9+' : count}</span>}
      </button>

      {open && (
        <div className="notif-dropdown__panel" role="menu" aria-label="Notifications">
          <div className="notif-dropdown__header">
            <h3>Notifications</h3>
            {count > 0 && (
              <button
                type="button"
                className="notif-dropdown__clear"
                onClick={() => visible.forEach((i) => dismiss(i.id))}
              >
                Clear all
              </button>
            )}
          </div>

          {visible.length === 0 ? (
            <div className="notif-dropdown__empty">
              <Bell size={28} strokeWidth={1.5} />
              <p>You're all caught up!</p>
            </div>
          ) : (
            <ul className="notif-dropdown__list">
              {visible.map((item) => {
                const Icon = item.icon;
                return (
                  <li
                    key={item.id}
                    className={`notif-item notif-item--${item.type}`}
                    role="menuitem"
                    onClick={handleItemClick}
                  >
                    <div className="notif-item__icon">
                      <Icon size={16} />
                    </div>
                    <div className="notif-item__body">
                      <span className="notif-item__title">{item.title}</span>
                      <span className="notif-item__text">{item.body}</span>
                      <span className="notif-item__date">{item.date}</span>
                    </div>
                    <button
                      type="button"
                      className="notif-item__dismiss"
                      aria-label="Dismiss notification"
                      title="Dismiss"
                      onClick={(e) => {
                        e.stopPropagation();
                        dismiss(item.id);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
