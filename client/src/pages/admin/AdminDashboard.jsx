  import { useEffect, useState } from 'react';
  import { Link } from 'react-router-dom';
  import {
    Users,
    UserPlus,
    Stethoscope,
    CalendarCheck,
    CalendarClock,
    ArrowRight,
    Clock,
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
   * Admin overview dashboard.
   * Fetches aggregate platform stats and displays metric cards
   * alongside quick-action links, status breakdown, and recent appointments.
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

    const breakdown = stats?.statusBreakdown;
    const recentAppointments = stats?.recentAppointments;

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

        {/* ── Monitoring Section ─────────────────────────── */}
        {!loading && !error && (
          <div className="admin-monitor-grid">
            {/* Status Breakdown */}
            {breakdown && (
              <Card className="admin-monitor-card">
                <div className="admin-monitor-header">
                  <h2>Appointment Status Breakdown</h2>
                </div>
                <div className="admin-breakdown-list">
                  <div className="admin-breakdown-item">
                    <span className="admin-status-badge admin-status-badge--upcoming">Upcoming</span>
                    <span className="admin-breakdown-count">{breakdown.upcoming}</span>
                  </div>
                  <div className="admin-breakdown-item">
                    <span className="admin-status-badge admin-status-badge--scheduled">Scheduled</span>
                    <span className="admin-breakdown-count">{breakdown.scheduled}</span>
                  </div>
                  <div className="admin-breakdown-item">
                    <span className="admin-status-badge admin-status-badge--confirmed">Confirmed</span>
                    <span className="admin-breakdown-count">{breakdown.confirmed}</span>
                  </div>
                  <div className="admin-breakdown-item">
                    <span className="admin-status-badge admin-status-badge--completed">Completed</span>
                    <span className="admin-breakdown-count">{breakdown.completed}</span>
                  </div>
                  <div className="admin-breakdown-item">
                    <span className="admin-status-badge admin-status-badge--cancelled">Cancelled</span>
                    <span className="admin-breakdown-count">{breakdown.cancelled}</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Recent Appointments */}
            <Card className="admin-monitor-card">
              <div className="admin-monitor-header">
                <h2>Recent Appointments</h2>
                <Link className="button--text" to="/admin/appointments">View all</Link>
              </div>
              {recentAppointments && recentAppointments.length > 0 ? (
                <div className="admin-recent-list">
                  {recentAppointments.map((apt) => (
                    <div key={apt._id} className="admin-recent-item">
                      <span className="admin-recent-icon">
                        <Clock size={16} aria-hidden="true" />
                      </span>
                      <div className="admin-recent-info">
                        <span className="admin-recent-primary">
                          {apt.patient?.fullName || '—'} → Dr. {apt.doctor?.name || '—'}
                        </span>
                        <span className="admin-recent-secondary">
                          {formatDate(apt.date)} · {apt.timeSlot || '—'}
                        </span>
                      </div>
                      <span className={`admin-status-badge admin-status-badge--${apt.status}`}>
                        {apt.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="admin-recent-empty">No appointments have been booked yet.</p>
              )}
            </Card>
          </div>
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
