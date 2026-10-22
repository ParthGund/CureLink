import { useEffect, useState, useMemo } from 'react';
import { Search, Users, UserX, UserCheck } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getPatients, deactivatePatient, reactivatePatient } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';

const SKELETON_ROWS = 5;

/**
 * Format an ISO date string into a readable date.
 * e.g. "2025-03-14T10:22:00Z" → "14 Mar 2025"
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

export default function AdminPatients() {
  const toast = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  /** ID of the patient whose status is currently being toggled. */
  const [actionId, setActionId] = useState(null);

  function fetchPatients() {
    setLoading(true);
    setError('');
    getPatients()
      .then((data) => setPatients(data ?? []))
      .catch((err) => setError(err.message || 'Failed to load patients.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchPatients(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
    );
  }, [patients, search]);

  /**
   * Toggle a patient's account status.
   * Shows a confirmation dialog, calls the appropriate API,
   * then updates the local list optimistically.
   */
  async function handleToggleStatus(patient) {
    const isActive = patient.isActive !== false; // default active for legacy records
    const action = isActive ? 'deactivate' : 'reactivate';
    const actionLabel = isActive ? 'Deactivate' : 'Reactivate';

    const confirmed = window.confirm(
      `${actionLabel} ${patient.name}?\n\n` +
      (isActive
        ? 'The patient will immediately lose access. Their medical records, appointments, and history will be preserved.'
        : 'The patient will regain login access to their existing account.')
    );
    if (!confirmed) return;

    setActionId(patient._id);
    try {
      if (isActive) {
        await deactivatePatient(patient._id);
        // Optimistic update — flip isActive locally
        setPatients((prev) =>
          prev.map((p) => p._id === patient._id ? { ...p, isActive: false } : p)
        );
        toast.success(`${patient.name}'s account has been deactivated.`);
      } else {
        await reactivatePatient(patient._id);
        setPatients((prev) =>
          prev.map((p) => p._id === patient._id ? { ...p, isActive: true } : p)
        );
        toast.success(`${patient.name}'s account has been reactivated.`);
      }
    } catch (err) {
      toast.error(err.message || `Failed to ${action} account.`);
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="admin-patients-page">
      {/* ── Header ──────────────────────────────────────── */}
      <header className="page-heading page-heading--with-action">
        <div>
          <h1>
            Patient Management
            {!loading && (
              <span className="admin-count-badge">{patients.length}</span>
            )}
          </h1>
          <p>View and manage registered patient accounts.</p>
        </div>
      </header>

      {/* ── Search ──────────────────────────────────────── */}
      <div className="admin-search-bar">
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && <p className="admin-error-banner">{error}</p>}

      {/* ── Table ───────────────────────────────────────── */}
      <Card className="admin-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Email Address</th>
                <th>Joined</th>
                <th>Status</th>
                <th className="admin-table__actions-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={`skel-${i}`} className="admin-table__skeleton-row">
                    <td><div className="skeleton-line" style={{ width: '65%' }} /></td>
                    <td><div className="skeleton-line" style={{ width: '75%' }} /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line" style={{ width: '55%' }} /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((patient) => {
                  // Treat missing isActive as active (backward-compatible with existing records)
                  const isActive = patient.isActive !== false;
                  const isBusy = actionId === patient._id;

                  return (
                    <tr key={patient._id}>
                      <td className="admin-table__name-cell">
                        <span className={`admin-table__avatar admin-table__avatar--patient${!isActive ? ' admin-table__avatar--patient' : ''}`}>
                          {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                        </span>
                        <span style={{ color: isActive ? undefined : 'var(--slate)' }}>
                          {patient.name || '—'}
                        </span>
                      </td>
                      <td style={{ color: isActive ? undefined : 'var(--slate)' }}>
                        {patient.email}
                      </td>
                      <td>{formatDate(patient.createdAt)}</td>
                      <td>
                        <span
                          className={`patient-status-badge patient-status-badge--${isActive ? 'active' : 'deactivated'}`}
                        >
                          {isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table__action-group">
                          {isActive ? (
                            <button
                              id={`deactivate-btn-${patient._id}`}
                              className="admin-table__deactivate-btn"
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleStatus(patient)}
                              aria-label={`Deactivate ${patient.name}`}
                            >
                              <UserX size={14} aria-hidden="true" />
                              {isBusy ? 'Deactivating…' : 'Deactivate'}
                            </button>
                          ) : (
                            <button
                              id={`reactivate-btn-${patient._id}`}
                              className="admin-table__reactivate-btn"
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleToggleStatus(patient)}
                              aria-label={`Reactivate ${patient.name}`}
                            >
                              <UserCheck size={14} aria-hidden="true" />
                              {isBusy ? 'Reactivating…' : 'Reactivate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="admin-table__empty-cell">
                    <EmptyState
                      icon={Users}
                      title={search ? 'No matching patients' : 'No patients registered'}
                      description={
                        search
                          ? 'Try adjusting your search terms.'
                          : 'Registered patient accounts will appear here.'
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
