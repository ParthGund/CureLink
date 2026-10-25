import { useEffect, useState, useCallback, useRef } from 'react';
import { CalendarClock, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import AppointmentList from '../../components/patient/AppointmentList';
import {
  getMyAppointments,
  cancelAppointment,
  getAvailableSlots,
  rescheduleAppointment,
} from '../../services/appointmentService';
import { useToast } from '../../context/ToastContext';

/** Statuses that count as "upcoming" (active, not yet completed). */
const ACTIVE_STATUSES = new Set(['upcoming', 'scheduled', 'confirmed']);

const TABS = [
  { key: 'all',       label: 'All' },
  { key: 'upcoming',  label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'missed',    label: 'Missed' },
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
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const slotRequestId = useRef(0);
  const toastRef = useRef(toast);
  toastRef.current = toast;

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

  useEffect(() => {
    if (!rescheduleTarget || !newDate || !rescheduleTarget.doctor?._id) {
      setAvailableSlots([]);
      setNewTimeSlot('');
      setSlotsLoading(false);
      return undefined;
    }

    const requestId = ++slotRequestId.current;
    setSlotsLoading(true);
    setAvailableSlots([]);
    setNewTimeSlot('');
    getAvailableSlots(rescheduleTarget.doctor._id, newDate)
      .then((slots) => {
        if (slotRequestId.current === requestId) setAvailableSlots(slots || []);
      })
      .catch((err) => {
        if (slotRequestId.current === requestId) {
          toastRef.current.error(err.message || 'Could not load available times.');
        }
      })
      .finally(() => {
        if (slotRequestId.current === requestId) setSlotsLoading(false);
      });

    return () => {
      if (slotRequestId.current === requestId) slotRequestId.current++;
    };
  }, [rescheduleTarget, newDate]);

  // ── Filtering ─────────────────────────────────────────────────
  const filteredAppointments = (() => {
    switch (activeTab) {
      case 'upcoming':
        return allAppointments.filter((a) => ACTIVE_STATUSES.has(a.status));
      case 'completed':
        return allAppointments.filter((a) => a.status === 'completed');
      case 'missed':
        return allAppointments.filter((a) => a.status === 'missed');
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
    missed:    { title: 'No missed appointments',    desc: 'You have no missed appointments on record.' },
    cancelled: { title: 'No cancelled appointments', desc: 'Cancelled appointments will appear here.' },
  };
  const empty = emptyConfig[activeTab] || emptyConfig.all;

  // ── Cancel flow ───────────────────────────────────────────────
  function handleCancelRequest(appointment) {
    setCancelTarget(appointment);
  }

  async function handleCancelConfirmed() {
    if (!cancelTarget) return;
    setConfirming(true);
    try {
      await cancelAppointment(cancelTarget._id);
      toast.success('Appointment cancelled.');
      setCancelTarget(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Unable to cancel appointment. Please try again.');
      setCancelTarget(null);
    } finally {
      setConfirming(false);
    }
  }

  function handleRescheduleRequest(appointment) {
    setRescheduleTarget(appointment);
    setNewDate('');
    setNewTimeSlot('');
  }

  async function handleRescheduleConfirmed() {
    if (!rescheduleTarget || !newDate || !newTimeSlot) return;
    setRescheduling(true);
    try {
      await rescheduleAppointment(rescheduleTarget._id, { date: newDate, timeSlot: newTimeSlot });
      toast.success('Appointment rescheduled.');
      setRescheduleTarget(null);
      fetchAppointments();
    } catch (err) {
      toast.error(err.message || 'Unable to reschedule appointment. Please try again.');
    } finally {
      setRescheduling(false);
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
          onRescheduleRequest={handleRescheduleRequest}
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
      {rescheduleTarget && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reschedule-title" onClick={() => !rescheduling && setRescheduleTarget(null)}>
          <div className="modal-panel modal-panel--narrow cancel-modal-body" onClick={(e) => e.stopPropagation()}>
            <h2 id="reschedule-title" className="cancel-modal-title">Reschedule appointment</h2>
            <p className="cancel-modal-desc">Choose a new available date and time with {rescheduleTarget.doctor?.name || 'your doctor'}.</p>
            <label className="reschedule-modal__label" htmlFor="reschedule-date">New date</label>
            <input
              id="reschedule-date"
              className="reschedule-modal__input"
              type="date"
              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)}
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              disabled={rescheduling}
            />
            <label className="reschedule-modal__label" htmlFor="reschedule-time">Available time</label>
            <select
              id="reschedule-time"
              className="reschedule-modal__input"
              value={newTimeSlot}
              onChange={(e) => setNewTimeSlot(e.target.value)}
              disabled={!newDate || slotsLoading || availableSlots.length === 0 || rescheduling}
            >
              <option value="">{slotsLoading ? 'Loading times…' : availableSlots.length ? 'Select a time' : 'No times available'}</option>
              {availableSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
            <div className="modal-actions">
              <button type="button" className="button button--secondary" onClick={() => setRescheduleTarget(null)} disabled={rescheduling}>Keep current time</button>
              <button type="button" className="button" onClick={handleRescheduleConfirmed} disabled={rescheduling || slotsLoading || !newDate || !newTimeSlot}>
                {rescheduling ? 'Rescheduling…' : 'Confirm reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}

      <CancelConfirmModal
        appointment={cancelTarget}
        onConfirm={handleCancelConfirmed}
        onDismiss={() => setCancelTarget(null)}
        confirming={confirming}
      />
    </div>
  );
}
