import { useEffect, useState, useCallback, useMemo } from 'react';
import { CalendarClock, CalendarCheck, History, Ban, Search, ChevronDown, Eye } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import AppointmentDetailModal from '../../components/doctor/AppointmentDetailModal';
import { getDoctorAppointments, getAppointmentById, cancelAppointment } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';

const TAB_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const SKELETON_ROWS = 5;

/**
 * Normalises an appointment date and zeros out the time portion
 * for accurate day-level comparison.
 */
function getAppointmentDay(apt) {
  const raw = apt.date;
  if (!raw) return 0;
  const d = new Date(raw);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Format an ISO date string into a readable short date.
 */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function DoctorAppointments() {
  const toast = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [search, setSearch] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    setError('');
    getDoctorAppointments()
      .then((data) => setAppointments(data.appointments ?? []))
      .catch((err) => setError(err.message || 'Failed to load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Categorise appointments
  const categorised = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const result = { upcoming: [], today: [], completed: [], cancelled: [] };

    for (const apt of appointments) {
      const dayMs = getAppointmentDay(apt);

      if (apt.status === 'cancelled') {
        result.cancelled.push(apt);
      } else if (apt.status === 'completed') {
        result.completed.push(apt);
      } else if (dayMs === todayMs) {
        result.today.push(apt);
      } else if (dayMs > todayMs) {
        result.upcoming.push(apt);
      } else {
        // Past non-completed/non-cancelled → show in completed
        result.completed.push(apt);
      }
    }

    // Upcoming sorted ascending (soonest first)
    result.upcoming.sort((a, b) => getAppointmentDay(a) - getAppointmentDay(b));
    // Today sorted by time slot
    result.today.sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

    return result;
  }, [appointments]);

  // Filter by search
  const filtered = useMemo(() => {
    const list = categorised[activeTab] || [];
    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter((apt) => {
      const patientName = apt.patient?.fullName || '';
      const patientEmail = apt.patient?.email || '';
      const reason = apt.reason || '';
      return (
        patientName.toLowerCase().includes(q) ||
        patientEmail.toLowerCase().includes(q) ||
        reason.toLowerCase().includes(q)
      );
    });
  }, [categorised, activeTab, search]);

  // Open appointment detail
  async function handleSelect(appointmentId) {
    setDetailLoading(true);
    try {
      const data = await getAppointmentById(appointmentId);
      setSelectedAppointment(data.appointment);
    } catch (err) {
      toast.error(err.message || 'Failed to load appointment details.');
    } finally {
      setDetailLoading(false);
    }
  }

  // Cancel appointment
  async function handleCancel(appointmentId) {
    setCancelling(true);
    try {
      await cancelAppointment(appointmentId);
      toast.success('Appointment cancelled.');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  }

  const tabCounts = {
    upcoming: categorised.upcoming.length,
    today: categorised.today.length,
    completed: categorised.completed.length,
    cancelled: categorised.cancelled.length,
  };

  const emptyMessages = {
    today: {
      icon: CalendarCheck,
      title: 'No appointments today',
      description: 'You do not have any consultations scheduled for today.',
    },
    upcoming: {
      icon: CalendarClock,
      title: 'No upcoming appointments',
      description: 'Scheduled patient consultations will appear here.',
    },
    completed: {
      icon: History,
      title: 'No completed appointments',
      description: 'Your completed consultations will appear here.',
    },
    cancelled: {
      icon: Ban,
      title: 'No cancelled appointments',
      description: 'Cancelled appointments will appear here.',
    },
  };

  const currentEmpty = emptyMessages[activeTab];

  return (
    <div>
      {/* ── Header ────────────────────────────────────────── */}
      <header className="page-heading">
        <h1>
          Appointments
          {!loading && (
            <span className="dr-apt-count">{appointments.length}</span>
          )}
        </h1>
        <p>Manage and review consultations scheduled with your patients.</p>
      </header>

      {/* ── Tab bar + search/filter row ───────────────────── */}
      <div className="dr-apt-controls">
        <div className="dr-apt-tabs" role="tablist" aria-label="Appointment categories">
          {TAB_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              className={`dr-apt-tab ${activeTab === key ? 'dr-apt-tab--active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
              <span className="dr-apt-tab__count">{loading ? '–' : tabCounts[key]}</span>
            </button>
          ))}
        </div>

        <div className="dr-apt-filter-row">
          <div className="dr-apt-search">
            <Search size={16} aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by patient name, email, or reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error && <p className="dr-apt-error">{error}</p>}

      {/* ── Table ─────────────────────────────────────────── */}
      <Card className="dr-apt-table-card">
        <div className="dr-apt-table-wrap">
          <table className="dr-apt-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                <th className="dr-apt-table__actions-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td><div className="skeleton-line" style={{ width: '70%' }} /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line" style={{ width: '60%' }} /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((apt) => {
                  const patientName = apt.patient?.fullName || '—';
                  const patientEmail = apt.patient?.email || '';

                  return (
                    <tr key={apt._id}>
                      <td className="dr-apt-table__patient-cell">
                        <span className="dr-apt-table__avatar">
                          {patientName.charAt(0).toUpperCase()}
                        </span>
                        <span className="dr-apt-table__patient-info">
                          <span className="dr-apt-table__patient-name">{patientName}</span>
                          {patientEmail && (
                            <span className="dr-apt-table__patient-email">{patientEmail}</span>
                          )}
                        </span>
                      </td>
                      <td>{formatDate(apt.date)}</td>
                      <td>{apt.timeSlot || '—'}</td>
                      <td className="dr-apt-table__reason-cell">
                        {apt.reason || <span className="dr-apt-table__muted">—</span>}
                      </td>
                      <td>
                        <span className={`dr-apt-status dr-apt-status--${apt.status}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="dr-apt-view-btn"
                          onClick={() => handleSelect(apt._id)}
                          aria-label={`View details for ${patientName}`}
                        >
                          <Eye size={15} aria-hidden="true" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="dr-apt-table__empty-cell">
                    <EmptyState
                      icon={search ? Search : currentEmpty.icon}
                      title={search ? 'No matching appointments' : currentEmpty.title}
                      description={search ? 'Try adjusting your search.' : currentEmpty.description}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Detail modal ──────────────────────────────────── */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onCancel={handleCancel}
          cancelling={cancelling}
        />
      )}

      {/* ── Loading overlay for detail fetch ───────────────── */}
      {detailLoading && (
        <div className="modal-overlay">
          <div className="dr-apt-detail-loading">
            <div className="auth-spinner" />
            <p>Loading appointment…</p>
          </div>
        </div>
      )}
    </div>
  );
}
