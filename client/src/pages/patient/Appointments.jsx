import { useEffect, useState, useCallback } from 'react';
import { CalendarClock, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import AppointmentList from '../../components/patient/AppointmentList';
import { getMyAppointments, cancelAppointment } from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';

/** Statuses that count as "upcoming" (active, not yet completed). */
const ACTIVE_STATUSES = new Set(['upcoming', 'scheduled', 'confirmed']);

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

/**
 * Returns the normalised day timestamp for an appointment (local midnight).
 * Handles both `date` and `appointmentDate` field names.
 */
function getDay(apt) {
  const raw = apt.appointmentDate || apt.date;
  if (!raw) return 0;
  const d = new Date(raw);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Inline cancel confirmation modal.
 * Rendered by Appointments when the patient clicks "Cancel appointment".
 */
function CancelConfirmModal({ appointment, onConfirm, onDismiss, confirming }) {
  if (!appointment) return null;

  const doctorName = appointment.doctor?.name || 'the doctor';
  const rawDate    = appointment.appointmentDate || appointment.date;
  const dateLabel  = rawDate
    ? new Date(rawDate).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      })
    : 'this appointment';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-apt-title"
      onClick={onDismiss}
    >
      <div
        className="modal-panel modal-panel--narrow cancel-modal-body"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cancel-modal-icon" aria-hidden="true">
          <X size={32} />
        </div>
        <h2 id="cancel-apt-title" className="cancel-modal-title">
          Cancel appointment?
        </h2>
        <p className="cancel-modal-desc">
          Are you sure you want to cancel your appointment with{' '}
          <strong>{doctorName}</strong> on <strong>{dateLabel}</strong>?
          This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={onDismiss}
            disabled={confirming}
          >
            Keep appointment
          </button>
          <button
            type="button"
            className="button button--danger"
            onClick={onConfirm}
            disabled={confirming}
          >
            {confirming ? 'Cancelling…' : 'Yes, cancel it'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PatientAppointments() {
  const toast = useToast();

  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [activeTab, setActiveTab]             = useState('all');

  // Cancel modal state
  const [cancelTarget,  setCancelTarget]  = useState(null);  // full appointment object
  const [confirming,    setConfirming]    = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchAppointments = useCallback(() => {
    setLoading(true);
    getMyAppointments()
      .then((data) => {
        const all = data.appointments ?? [];
        // Sort: upcoming ascending (soonest first), then rest descending
        all.sort((a, b) => {
          const aActive = ACTIVE_STATUSES.has(a.status);
          const bActive = ACTIVE_STATUSES.has(b.status);
          if (aActive && bActive) return getDay(a) - getDay(b);
          if (aActive) return -1;
          if (bActive) return 1;
          return getDay(b) - getDay(a);
        });
        setAllAppointments(all);
      })
      .catch(() => setAllAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // ── Filtering ─────────────────────────────────────────────────
  const filteredAppointments = (() => {
    switch (activeTab) {
      case 'upcoming':
        return allAppointments.filter((a) => ACTIVE_STATUSES.has(a.status));
      case 'completed':
        return allAppointments.filter((a) => a.status === 'completed');
      case 'cancelled':
        return allAppointments.filter((a) => a.status === 'cancelled');
      default:
        return allAppointments;
    }
  })();

  // ── Tab empty state config ────────────────────────────────────
  const emptyConfig = {
    all:       { title: 'No appointments yet',       desc: 'Book your first appointment to get started.' },
    upcoming:  { title: 'No upcoming appointments',  desc: 'Your scheduled consultations will appear here.' },
    completed: { title: 'No completed visits',       desc: 'Past consultations will appear here after they complete.' },
    cancelled: { title: 'No cancelled appointments', desc: 'Cancelled appointments will appear here.' },
  };
  const empty = emptyConfig[activeTab];

  // ── Cancel flow ───────────────────────────────────────────────
  function handleCancelRequest(appointment) {
    setCancelTarget(appointment);
  }

  async function handleCancelConfirmed() {
    if (!cancelTarget) return;
    setConfirming(true);
    try {
      await cancelAppointment(cancelTarget._id);
      toast.error('Appointment cancelled.');
      setCancelTarget(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Unable to cancel appointment. Please try again.');
      setCancelTarget(null);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div>
      <header className="page-heading page-heading--with-action">
        <div>
          <h1>Appointments</h1>
          <p>Manage your upcoming and past consultations.</p>
        </div>
        <div className="page-heading__actions">
          <Button to="/patient/doctors" variant="secondary">Find a Doctor</Button>
          <Button to="/patient/appointments/book">Book Appointment</Button>
        </div>
      </header>

      {/* ── Status tabs ─────────────────────────────────────── */}
      <div className="apt-tab-bar" role="tablist" aria-label="Appointment filter">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            className={`apt-tab${activeTab === key ? ' apt-tab--active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      {loading ? (
        <Card className="apt-loading-card">
          <p className="loading-text">Loading appointments…</p>
        </Card>
      ) : filteredAppointments.length > 0 ? (
        <AppointmentList
          appointments={filteredAppointments}
          onCancelRequest={handleCancelRequest}
        />
      ) : (
        <Card className="apt-empty-card">
          <EmptyState
            icon={CalendarClock}
            title={empty.title}
            description={empty.desc}
            action={
              activeTab === 'upcoming' || activeTab === 'all'
                ? <Button to="/patient/appointments/book">Book an Appointment</Button>
                : undefined
            }
          />
        </Card>
      )}

      {/* ── Cancel confirmation modal ────────────────────────── */}
      <CancelConfirmModal
        appointment={cancelTarget}
        onConfirm={handleCancelConfirmed}
        onDismiss={() => setCancelTarget(null)}
        confirming={confirming}
      />
    </div>
  );
}
