import { useEffect, useState, useMemo } from 'react';
import { Search, CalendarCheck, ChevronDown } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getAppointments, updateAppointmentStatus } from '../../services/adminService';

const SKELETON_ROWS = 5;

const STATUS_OPTIONS = ['all', 'upcoming', 'completed', 'cancelled'];

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

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  function fetchAppointments() {
    setLoading(true);
    setError('');
    getAppointments()
      .then((data) => setAppointments(data ?? []))
      .catch((err) => setError(err.message || 'Failed to load appointments.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchAppointments(); }, []);

  // Client-side filter: search + status
  const filtered = useMemo(() => {
    let result = appointments;

    if (statusFilter !== 'all') {
      result = result.filter((a) => a.status === statusFilter);
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
  }, [appointments, search, statusFilter]);

  async function handleStatusChange(appointment, newStatus) {
    if (appointment.status === newStatus) return;

    setUpdatingId(appointment._id);
    try {
      await updateAppointmentStatus(appointment._id, newStatus);
      // Update local state
      setAppointments((prev) =>
        prev.map((a) =>
          a._id === appointment._id ? { ...a, status: newStatus } : a
        )
      );
    } catch (err) {
      alert(err.message || 'Failed to update appointment status.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="admin-appointments-page">
      {/* ── Header ──────────────────────────────────────── */}
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

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="admin-filter-row">
        <div className="admin-search-bar admin-search-bar--flex">
          <Search size={18} aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by patient, doctor, or specialization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="admin-status-filter">
          <select
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

      {/* ── Table ───────────────────────────────────────── */}
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
                        <span className={`admin-status-badge admin-status-badge--${apt.status}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-apt-actions">
                          {apt.status === 'upcoming' && (
                            <>
                              <button
                                className="admin-apt-action admin-apt-action--complete"
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(apt, 'completed')}
                              >
                                {isUpdating ? '…' : 'Complete'}
                              </button>
                              <button
                                className="admin-apt-action admin-apt-action--cancel"
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleStatusChange(apt, 'cancelled')}
                              >
                                {isUpdating ? '…' : 'Cancel'}
                              </button>
                            </>
                          )}
                          {apt.status === 'completed' && (
                            <span className="admin-apt-done">Done</span>
                          )}
                          {apt.status === 'cancelled' && (
                            <span className="admin-apt-done admin-apt-done--cancelled">Cancelled</span>
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
                      title={search || statusFilter !== 'all' ? 'No matching appointments' : 'No appointments yet'}
                      description={
                        search || statusFilter !== 'all'
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
    </div>
  );
}
