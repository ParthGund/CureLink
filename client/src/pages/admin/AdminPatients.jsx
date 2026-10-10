import { useEffect, useState, useMemo } from 'react';
import { Search, Users } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getPatients } from '../../services/adminService';

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
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');


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
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((patient) => (
                  <tr key={patient._id}>
                    <td className="admin-table__name-cell">
                      <span className="admin-table__avatar admin-table__avatar--patient">
                        {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                      </span>
                      <span>{patient.name || '—'}</span>
                    </td>
                    <td>{patient.email}</td>
                    <td>{formatDate(patient.createdAt)}</td>
                    <td>
                      <span className="admin-table__badge" style={{ fontSize: '11px', padding: '4px 8px', background: '#f1f5f9', color: '#64748b', borderRadius: '4px', display: 'inline-block' }}>
                        Medical Record Retained
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="admin-table__empty-cell">
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
