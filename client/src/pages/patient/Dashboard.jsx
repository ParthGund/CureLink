import { useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, Activity, Bell, FolderOpen, FileText } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import AppointmentList from '../../components/patient/AppointmentList';
import { getMyAppointments } from '../../services/appointmentService';
import { formatDisplayDate } from '../../utils/dateUtils';

/** Statuses that count as "upcoming" / active. */
const ACTIVE_STATUSES = new Set(['upcoming', 'scheduled', 'confirmed']);

const DASHBOARD_RECENT_LIMIT = 3;

/** 48 hours in milliseconds. */
const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

/**
 * Return the raw Date object for an appointment.
 * Handles both `date` and `appointmentDate` field names.
 */
function getAptDate(apt) {
  const raw = apt.appointmentDate || apt.date;
  return raw ? new Date(raw) : null;
}

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    getMyAppointments()
      .then((data) => {
        const all = data.appointments ?? [];
        // Sort active appointments ascending (soonest first), then rest
        all.sort((a, b) => {
          const aActive = ACTIVE_STATUSES.has(a.status);
          const bActive = ACTIVE_STATUSES.has(b.status);
          if (aActive && bActive) {
            return (getAptDate(a)?.getTime() ?? 0) - (getAptDate(b)?.getTime() ?? 0);
          }
          if (aActive) return -1;
          if (bActive) return 1;
          return (getAptDate(b)?.getTime() ?? 0) - (getAptDate(a)?.getTime() ?? 0);
        });
        setAppointments(all);
      })
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived values ────────────────────────────────────────────
  const upcomingList  = appointments.filter((a) => ACTIVE_STATUSES.has(a.status));
  const completedList = appointments.filter((a) => a.status === 'completed');

  const countUpcoming  = upcomingList.length;
  const countCompleted = completedList.length;
  const countTotal     = appointments.filter((a) => a.status !== 'cancelled').length;

  // Next upcoming appointment (soonest one in the active list)
  const nextAppointment = upcomingList[0] ?? null;

  // Determine if the next appointment is within 48 h
  const isWithin48h = (() => {
    if (!nextAppointment) return false;
    const d = getAptDate(nextAppointment);
    if (!d) return false;
    return d.getTime() - Date.now() <= FORTY_EIGHT_HOURS_MS;
  })();

  // Recent activity — last 3 appointments across all statuses
  const recentActivity = appointments.slice(0, DASHBOARD_RECENT_LIMIT);

  // ── Stat card definitions ─────────────────────────────────────
  const statCards = [
    {
      id:     'upcoming',
      icon:   CalendarCheck,
      label:  'Upcoming Visits',
      value:  loading ? '—' : countUpcoming,
      mod:    'teal',
    },
    {
      id:     'completed',
      icon:   CheckCircle2,
      label:  'Completed Visits',
      value:  loading ? '—' : countCompleted,
      mod:    'blue',
    },
    {
      id:     'total',
      icon:   Activity,
      label:  'Total Consultations',
      value:  loading ? '—' : countTotal,
      mod:    'slate',
    },
  ];

  return (
    <div className="dashboard-page">
      <header className="page-heading">
        <h1>Welcome back.</h1>
        <p>Your healthcare information, appointments, and activity will appear here.</p>
      </header>

      {/* ── Stat cards ──────────────────────────────────────── */}
      <div className="patient-stat-grid">
        {statCards.map(({ id, icon: Icon, label, value, mod }) => (
          <Card key={id} className={`patient-stat-card patient-stat-card--${mod}`}>
            <div className="patient-stat-card__icon" aria-hidden="true">
              <Icon size={22} />
            </div>
            <div className="patient-stat-card__body">
              <span className="patient-stat-card__value">{value}</span>
              <span className="patient-stat-card__label">{label}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Next appointment reminder banner ─────────────────── */}
      {!loading && (
        nextAppointment ? (
          <div className={`apt-reminder-banner${isWithin48h ? ' apt-reminder-banner--urgent' : ''}`}>
            <div className="apt-reminder-banner__icon" aria-hidden="true">
              <Bell size={20} />
            </div>
            <div className="apt-reminder-banner__content">
              <p className="apt-reminder-banner__label">
                {isWithin48h ? 'Upcoming soon' : 'Next appointment'}
              </p>
              <p className="apt-reminder-banner__detail">
                <strong>{nextAppointment.doctor?.name ?? 'Your doctor'}</strong>
                {nextAppointment.doctor?.specialization
                  ? <> · {nextAppointment.doctor.specialization}</>
                  : null}
              </p>
              <p className="apt-reminder-banner__when">
                {getAptDate(nextAppointment)
                  ? formatDisplayDate(
                      getAptDate(nextAppointment).toISOString().split('T')[0]
                    )
                  : ''}
                {nextAppointment.timeSlot ? ` · ${nextAppointment.timeSlot}` : ''}
              </p>
            </div>
            <Button
              to="/patient/appointments"
              variant="secondary"
              className="apt-reminder-banner__cta"
            >
              View Details
            </Button>
          </div>
        ) : (
          <div className="apt-reminder-banner apt-reminder-banner--empty">
            <div className="apt-reminder-banner__icon" aria-hidden="true">
              <CalendarCheck size={20} />
            </div>
            <div className="apt-reminder-banner__content">
              <p className="apt-reminder-banner__label">No upcoming appointments</p>
              <p className="apt-reminder-banner__detail">
                Find a doctor and book a slot to get started.
              </p>
            </div>
            <Button to="/patient/doctors" className="apt-reminder-banner__cta">
              Find a Doctor &amp; Book Slot
            </Button>
          </div>
        )
      )}

      {/* ── Recent activity ──────────────────────────────────── */}
      <section className="dashboard-recent" aria-labelledby="recent-activity-heading">
        <div className="section-heading">
          <h2 id="recent-activity-heading">Recent Activity</h2>
          <Button to="/patient/appointments" variant="text">View All</Button>
        </div>

        {loading ? (
          <Card><p className="loading-text">Loading activity…</p></Card>
        ) : recentActivity.length > 0 ? (
          <AppointmentList appointments={recentActivity} />
        ) : (
          <Card>
            <EmptyState
              icon={CalendarCheck}
              title="No activity yet"
              description="Your appointment history will appear here."
              action={<Button to="/patient/appointments/book">Book an Appointment</Button>}
            />
          </Card>
        )}
      </section>

      {/* ── Medical history placeholders ─────────────────────── */}
      <section className="recent-section" aria-labelledby="medical-heading">
        <div className="section-heading">
          <h2 id="medical-heading">Medical Records</h2>
          <Button to="/patient/medical-history" variant="text">View All</Button>
        </div>
        <div className="recent-grid">
          <Card>
            <EmptyState
              icon={FolderOpen}
              title="No medical records yet"
              description="Your consultation history will appear here."
            />
          </Card>
          <Card>
            <EmptyState
              icon={FileText}
              title="No prescriptions yet"
              description="Your active prescriptions will appear here."
            />
          </Card>
        </div>
      </section>
    </div>
  );
}
