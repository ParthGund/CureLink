import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Stethoscope,
  CalendarCheck,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import Card from '../../components/common/Card';
import { getStats } from '../../services/adminService';

const STAT_CARDS = [
  { key: 'totalDoctors', label: 'Total Doctors', icon: Stethoscope },
  { key: 'totalPatients', label: 'Total Patients', icon: Users },
  { key: 'totalAppointments', label: 'Total Appointments', icon: CalendarCheck },
  { key: 'pendingAppointments', label: 'Upcoming Consultations', icon: CalendarClock },
];

const QUICK_ACTIONS = [
  { label: 'Add Doctor', to: '/admin/doctors', icon: UserPlus },
  { label: 'Manage Bookings', to: '/admin/appointments', icon: CalendarCheck },
  { label: 'View Patients', to: '/admin/patients', icon: Users },
];

/**
 * Admin overview dashboard.
 * Fetches aggregate platform stats and displays metric cards
 * alongside quick-action links.
 */
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err.message || 'Unable to load platform stats.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="dashboard-page">
      <header className="page-heading">
        <h1>Admin Overview</h1>
        <p>Monitor platform activity, manage doctors, patients, and appointments.</p>
      </header>

      {/* ── Stat Cards ─────────────────────────────────── */}
      <div className="admin-stats-grid">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => (
          <Card key={key} className="admin-stat-card">
            {loading ? (
              <div className="admin-stat-skeleton">
                <div className="skeleton-circle" />
                <div className="skeleton-lines">
                  <div className="skeleton-line skeleton-line--short" />
                  <div className="skeleton-line" />
                </div>
              </div>
            ) : error ? (
              <div className="admin-stat-body">
                <span className="admin-stat-icon admin-stat-icon--muted">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="admin-stat-value">—</span>
                <span className="admin-stat-label">{label}</span>
              </div>
            ) : (
              <div className="admin-stat-body">
                <span className="admin-stat-icon">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="admin-stat-value">{stats[key]}</span>
                <span className="admin-stat-label">{label}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {error && (
        <p className="admin-error-banner">{error}</p>
      )}

      {/* ── Quick Actions ──────────────────────────────── */}
      <section className="admin-quick-section" aria-labelledby="quick-actions-heading">
        <h2 id="quick-actions-heading">Quick Actions</h2>
        <div className="admin-quick-grid">
          {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
            <Link key={to} className="admin-quick-card" to={to}>
              <span className="admin-quick-icon">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span className="admin-quick-label">{label}</span>
              <ArrowRight size={17} className="admin-quick-arrow" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
