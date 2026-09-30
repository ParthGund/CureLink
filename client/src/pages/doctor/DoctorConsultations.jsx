import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CircleCheck, Eye } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getDoctorConsultations } from '../../services/consultationService';

/**
 * Format an ISO date string into a readable short date.
 */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DoctorConsultations() {
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('in_progress');

  useEffect(() => {
    getDoctorConsultations()
      .then((data) => setConsultations(data.consultations ?? []))
      .catch((err) => setError(err.message || 'Failed to load consultations.'))
      .finally(() => setLoading(false));
  }, []);

  const { inProgress, completed } = useMemo(() => {
    const ip = [];
    const co = [];
    for (const c of consultations) {
      if (c.status === 'completed') co.push(c);
      else ip.push(c);
    }
    // newest first
    ip.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    co.sort((a, b) => new Date(b.completedAt || b.createdAt) - new Date(a.completedAt || a.createdAt));
    return { inProgress: ip, completed: co };
  }, [consultations]);

  const current = tab === 'in_progress' ? inProgress : completed;

  return (
    <div>
      <header className="page-heading">
        <h1>Consultations</h1>
        <p>Record and review authorised patient consultations.</p>
      </header>

      <div className="dr-apt-controls">
        <div className="dr-apt-tabs" role="tablist" aria-label="Consultation status">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'in_progress'}
            className={`dr-apt-tab ${tab === 'in_progress' ? 'dr-apt-tab--active' : ''}`}
            onClick={() => setTab('in_progress')}
          >
            In progress
            <span className="dr-apt-tab__count">{loading ? '–' : inProgress.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'completed'}
            className={`dr-apt-tab ${tab === 'completed' ? 'dr-apt-tab--active' : ''}`}
            onClick={() => setTab('completed')}
          >
            Completed
            <span className="dr-apt-tab__count">{loading ? '–' : completed.length}</span>
          </button>
        </div>
      </div>

      {error && <p className="dr-apt-error">{error}</p>}

      <Card className="dr-apt-table-card">
        <div className="dr-apt-table-wrap">
          <table className="dr-apt-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th className="dr-apt-table__actions-head">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skel-${i}`}>
                    <td><div className="skeleton-line dr-consult-skel-name" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                    <td><div className="skeleton-line skeleton-line--short" /></td>
                  </tr>
                ))
              ) : current.length > 0 ? (
                current.map((c) => {
                  const patientName = c.patient?.fullName || '—';
                  const isIP = c.status === 'in_progress';

                  return (
                    <tr key={c._id}>
                      <td className="dr-apt-table__patient-cell">
                        <span className="dr-apt-table__avatar">
                          {patientName.charAt(0).toUpperCase()}
                        </span>
                        <span className="dr-apt-table__patient-name">{patientName}</span>
                      </td>
                      <td>{formatDate(c.appointment?.date)}</td>
                      <td>{c.appointment?.timeSlot || '—'}</td>
                      <td>
                        <span className={`dr-apt-status dr-apt-status--${c.status === 'in_progress' ? 'upcoming' : 'completed'}`}>
                          {isIP ? 'In progress' : 'Completed'}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/doctor/consultations/${c._id}`}
                          className="dr-apt-view-btn"
                        >
                          <Eye size={15} aria-hidden="true" />
                          {isIP ? 'Open' : 'View'}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="dr-apt-table__empty-cell">
                    {tab === 'in_progress' ? (
                      <EmptyState
                        icon={Clock}
                        title="No consultations in progress"
                        description="Start a consultation from one of your appointments."
                      />
                    ) : (
                      <EmptyState
                        icon={CircleCheck}
                        title="No completed consultations"
                        description="Completed consultations will appear here."
                      />
                    )}
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
