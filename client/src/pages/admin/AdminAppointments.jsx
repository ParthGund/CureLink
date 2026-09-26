import { useEffect, useState, useMemo } from 'react';
import { Search, CalendarCheck, ChevronDown, AlertTriangle } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getAppointments, getDoctors, updateAppointmentStatus } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const SKELETON_ROWS = 5;

const STATUS_OPTIONS = ['all', 'scheduled', 'confirmed', 'completed', 'cancelled', 'upcoming'];

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

/**
 * Inline cancel-confirmation modal.
 * Shown when the admin clicks "Cancel" on an appointment.
 */
function CancelConfirmModal({ appointment, onConfirm, onDismiss }) {
  if (!appointment) return null;

  const patientName =
    appointment.patient?.fullName || appointment.patient?.name || 'this patient';
  const doctorName = appointment.doctor?.name || 'the doctor';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-modal-title"
      onClick={onDismiss}
    >
      <div
        className="modal-panel modal-panel--narrow"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cancel-modal-body">
          <span className="cancel-modal-icon" aria-hidden="true">
            <AlertTriangle size={28} />
          </span>
          <h2 id="cancel-modal-title" className="cancel-modal-title">
            Cancel appointment?
          </h2>
          <p className="cancel-modal-desc">
            You are about to cancel the appointment for{' '}
            <strong>{patientName}</strong> with <strong>Dr. {doctorName}</strong> on{' '}
            <strong>{formatDate(appointment.date)}</strong> at{' '}
            <strong>{appointment.timeSlot || '—'}</strong>. This action cannot be undone.
          </p>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onDismiss}
            >
              Keep appointment
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={onConfirm}
            >
              Yes, cancel it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminAppointments() {
  const toast = useToast();

  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [doctorFilter, setDoctorFilter] = useState('all');

  // In-flight status update tracking
  const [updatingId, setUpdatingId] = useState(null);

  // Cancel confirmation modal target
  const [cancelTarget, setCancelTarget] = useState(null);

  // ── Data fetching ──────────────────────────────────────────────

  function fetchData() {
    setLoading(true);
    setError('');
    Promise.all([getAppointments(), getDoctors()])
      .then(([appts, docs]) => {
        setAppointments(appts ?? []);
        setDoctors(docs ?? []);
      })
      .catch((err) => setError(err.message || 'Failed to load appointments.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, []);

  // ── Client-side filtering ──────────────────────────────────────

  const filtered = useMemo(() => {
    let result = appointments;

    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
    }

    if (doctorFilter !== 'all') {
      result = result.filter((a) => {
        const docId = a.doctor?._id || a.doctor;
        return String(docId) === doctorFilter;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((a) => {
        const patientName = a.patient?.fullName || a.patient?.name || '';
        const doctorName = a.doctor?.name || '';
        const spec = a.doctor?.specialization || '';
        return (
          patientName.toLowerCase().includes(q) ||
          doctorName.toLowerCase().includes(q) ||
          spec.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [appointments, search, statusFilter, doctorFilter]);

  // ── Status update handlers ─────────────────────────────────────

  async function applyStatusChange(appointmentId, newStatus) {
    setUpdatingId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === appointmentId ? { ...a, status: newStatus } : a
        )
      );

      if (newStatus === 'confirmed') {
        toast.success('Appointment confirmed');
      } else if (newStatus === 'completed') {
        toast.success('Appointment marked as completed');
      } else if (newStatus === 'cancelled') {
        toast.error('Appointment cancelled');
      } else {
        toast.success('Appointment status updated');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update appointment status.');
    } finally {
      setUpdatingId(null);
    }
  }

  function handleConfirm(apt) {
    applyStatusChange(apt._id, 'confirmed');
  }

  function handleComplete(apt) {
    applyStatusChange(apt._id, 'completed');
  }

  function requestCancel(apt) {
    setCancelTarget(apt);
  }

  function handleCancelConfirmed() {
    if (!cancelTarget) return;
    const id = cancelTarget._id;
    setCancelTarget(null);
    applyStatusChange(id, 'cancelled');
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="admin-appointments-page">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="page-heading page-heading--with-action">
        <div>
          <h1>
            Appointment Oversight
            {!loading && (
              <span className="admin-count-badge">{appointments.length}</span>
            )}
          </h1>
          <p>Monitor and manage all appointments across the platform.</p>
        </div>
      </header>

      {/* ── Filters ───────────────────────────────────────── */}
      <div className="admin-filter-row admin-filter-row--triple">
        {/* Search */}
        <div className="admin-search-bar admin-search-bar--flex">
          <Search size={18} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by patient, doctor, or specialization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search appointments"
          />
        </div>

        {/* Doctor filter */}
        <div className="admin-status-filter">
          <select
            id="admin-doctor-filter"
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            aria-label="Filter by doctor"
          >
            <option value="all">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="admin-status-filter__icon" aria-hidden="true" />
        </div>

        {/* Status filter */}
        <div className="admin-status-filter">
          <select
            id="admin-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="admin-status-filter__icon" aria-hidden="true" />
        </div>
      </div>

      {error && <p className="admin-error-banner">{error}</p>}

      {/* ── Table ─────────────────────────────────────────── */}
      <Card className="admin-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Specialization</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Status</th>
                <th className="admin-table__actions-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={`skel-${i}`} className="admin-table__skeleton-row">
                    <td><div className="skeleton-line" style={{ width: '60%' }} /></td>
                    <td><div className="skeleton-line" style={{ width: '65%' }} /></td>
                    <td><div className="skeleton-line" style={{ width: '50%' }} /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((apt) => {
                  const patientName = apt.patient?.fullName || apt.patient?.name || '—';
                  const doctorName = apt.doctor?.name || '—';
                  const specialization = apt.doctor?.specialization || '—';
                  const isUpdating = updatingId === apt._id;
                  const isScheduledOrUpcoming =
                    apt.status === 'scheduled' || apt.status === 'upcoming';
                  const isConfirmed = apt.status === 'confirmed';
                  const isFinal =
                    apt.status === 'completed' || apt.status === 'cancelled';

                  return (
                    <tr key={apt._id}>
                      <td className="admin-table__name-cell">
                        <span className="admin-table__avatar admin-table__avatar--patient">
                          {patientName.charAt(0).toUpperCase()}
                        </span>
                        <span>{patientName}</span>
                      </td>
                      <td>{doctorName}</td>
                      <td>
                        <span className="admin-table__spec-badge">{specialization}</span>
                      </td>
                      <td>{formatDate(apt.date)}</td>
                      <td>{apt.timeSlot || '—'}</td>
                      <td>
                        <span
                          className={`admin-status-badge admin-status-badge--${apt.status}`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-apt-actions">
                          {/* Scheduled / Upcoming → Confirm + Cancel */}
                          {isScheduledOrUpcoming && (
                            <>
                              <button
                                className="admin-apt-action admin-apt-action--confirm"
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleConfirm(apt)}
                                aria-label={`Confirm appointment for ${patientName}`}
                              >
                                {isUpdating ? '…' : 'Confirm'}
                              </button>
                              <button
                                className="admin-apt-action admin-apt-action--cancel"
                                type="button"
                                disabled={isUpdating}
                                onClick={() => requestCancel(apt)}
                                aria-label={`Cancel appointment for ${patientName}`}
                              >
                                {isUpdating ? '…' : 'Cancel'}
                              </button>
                            </>
                          )}

                          {/* Confirmed → Complete + Cancel */}
                          {isConfirmed && (
                            <>
                              <button
                                className="admin-apt-action admin-apt-action--complete"
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleComplete(apt)}
                                aria-label={`Mark appointment for ${patientName} as completed`}
                              >
                                {isUpdating ? '…' : 'Complete'}
                              </button>
                              <button
                                className="admin-apt-action admin-apt-action--cancel"
                                type="button"
                                disabled={isUpdating}
                                onClick={() => requestCancel(apt)}
                                aria-label={`Cancel appointment for ${patientName}`}
                              >
                                {isUpdating ? '…' : 'Cancel'}
                              </button>
                            </>
                          )}

                          {/* Final states → read-only badge */}
                          {isFinal && (
                            <span
                              className={`admin-apt-done${apt.status === 'cancelled' ? ' admin-apt-done--cancelled' : ''}`}
                            >
                              {apt.status === 'completed' ? 'Done' : 'Cancelled'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="admin-table__empty-cell">
                    <EmptyState
                      icon={CalendarCheck}
                      title={
                        search || statusFilter !== 'all' || doctorFilter !== 'all'
                          ? 'No matching appointments'
                          : 'No appointments yet'
                      }
                      description={
                        search || statusFilter !== 'all' || doctorFilter !== 'all'
                          ? 'Try adjusting your filters.'
                          : 'Appointments booked on the platform will appear here.'
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Cancel confirmation modal ──────────────────────── */}
      <CancelConfirmModal
        appointment={cancelTarget}
        onConfirm={handleCancelConfirmed}
        onDismiss={() => setCancelTarget(null)}
      />
    </div>
  );
}
