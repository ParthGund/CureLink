import { useEffect, useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import AddDoctorModal from '../../components/admin/AddDoctorModal';
import { getDoctors, deleteDoctor } from '../../services/adminService';

const SKELETON_ROWS = 4;

/**
 * Format a numeric day array (0=Sun … 6=Sat) into a short human-readable string.
 */
function formatDays(days) {
  if (!days || days.length === 0) return '—';
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return [...days].sort((a, b) => a - b).map((d) => names[d]).join(', ');
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  function fetchDoctors() {
    setLoading(true);
    setError('');
    getDoctors()
      .then((data) => setDoctors(data ?? []))
      .catch((err) => setError(err.message || 'Failed to load doctors.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchDoctors(); }, []);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return doctors;
    const q = search.toLowerCase();
    return doctors.filter(
      (d) =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.specialization && d.specialization.toLowerCase().includes(q))
    );
  }, [doctors, search]);

  async function handleDelete(doctor) {
    const confirmed = window.confirm(
      `Remove ${doctor.name}?\n\nThis will permanently delete the doctor profile and linked user account.`
    );
    if (!confirmed) return;

    setDeletingId(doctor._id);
    try {
      await deleteDoctor(doctor._id);
      setDoctors((prev) => prev.filter((d) => d._id !== doctor._id));
    } catch (err) {
      alert(err.message || 'Failed to remove doctor.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="admin-doctors-page">
      {/* ── Page Header ─────────────────────────────────── */}
      <header className="page-heading page-heading--with-action">
        <div>
          <h1>Doctor Management</h1>
          <p>Register, view, and manage healthcare practitioners on the platform.</p>
        </div>
        <button className="button" type="button" onClick={() => setModalOpen(true)}>
          <UserPlus size={17} aria-hidden="true" style={{ marginRight: 7 }} />
          Add New Doctor
        </button>
      </header>

      {/* ── Search Bar ──────────────────────────────────── */}
      <div className="admin-search-bar">
        <Search size={18} aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by name or specialization…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Error ───────────────────────────────────────── */}
      {error && <p className="admin-error-banner">{error}</p>}

      {/* ── Table ───────────────────────────────────────── */}
      <Card className="admin-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Email</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th>Working Hours</th>
                <th className="admin-table__actions-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <tr key={`skel-${i}`} className="admin-table__skeleton-row">
                    <td><div className="skeleton-line" style={{ width: '70%' }} /></td>
                    <td><div className="skeleton-line" style={{ width: '80%' }} /></td>
                    <td><div className="skeleton-line" style={{ width: '55%' }} /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line" style={{ width: '65%' }} /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                  </tr>
                ))
              ) : filtered.length > 0 ? (
                filtered.map((doc) => (
                  <tr key={doc._id}>
                    <td className="admin-table__name-cell">
                      <span className="admin-table__avatar">
                        {doc.name ? doc.name.charAt(0).toUpperCase() : 'D'}
                      </span>
                      <span>{doc.name}</span>
                    </td>
                    <td>{doc.email || doc.user?.email || '—'}</td>
                    <td>
                      <span className="admin-table__spec-badge">{doc.specialization}</span>
                    </td>
                    <td>{doc.experience != null ? `${doc.experience} yr${doc.experience !== 1 ? 's' : ''}` : '—'}</td>
                    <td>
                      {doc.workingHours
                        ? `${doc.workingHours.start} – ${doc.workingHours.end}`
                        : '—'}
                      {doc.workingDays && (
                        <span className="admin-table__days">{formatDays(doc.workingDays)}</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="admin-table__remove-btn"
                        type="button"
                        disabled={deletingId === doc._id}
                        onClick={() => handleDelete(doc)}
                        aria-label={`Remove ${doc.name}`}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        {deletingId === doc._id ? 'Removing…' : 'Remove'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="admin-table__empty-cell">
                    <EmptyState
                      icon={Stethoscope}
                      title={search ? 'No matching doctors' : 'No doctors registered'}
                      description={
                        search
                          ? 'Try adjusting your search terms.'
                          : 'Registered healthcare practitioners will appear here.'
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Add Doctor Modal ────────────────────────────── */}
      <AddDoctorModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchDoctors}
      />
    </div>
  );
}
