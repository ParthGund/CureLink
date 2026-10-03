import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Users, FileText, Activity, UserCog,
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getMySlots, getMyPatients, getMyProfile } from '../../services/doctorService';
import { getDoctorConsultations } from '../../services/consultationService';

/**
 * Returns a YYYY-MM-DD string for the given Date in local time.
 * Using toISOString() gives UTC, which can be the wrong calendar date.
 */
function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format an ISO date string as a short readable date.
 */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format an ISO date string as a relative or absolute time label.
 * Shows "Today" / "Yesterday" for recent dates, otherwise a short date.
 */
function formatRelativeDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const today = new Date();
  const todayStr = toLocalDateString(today);
  const dStr = toLocalDateString(d);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = toLocalDateString(yesterday);
  if (dStr === todayStr) return 'Today';
  if (dStr === yesterdayStr) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function DoctorDashboard() {
  const [slots, setSlots] = useState([]);
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const todayString = toLocalDateString(today);

    Promise.allSettled([
      getMySlots({ from: todayString, to: todayString }),
      getMyPatients(),
      getDoctorConsultations(),
      getMyProfile(),
    ]).then(([slotsResult, patientsResult, consultationsResult, profileResult]) => {
      if (slotsResult.status === 'fulfilled') {
        setSlots(slotsResult.value || []);
      }
      if (patientsResult.status === 'fulfilled') {
        setPatients(patientsResult.value || []);
      }
      if (consultationsResult.status === 'fulfilled') {
        setConsultations(consultationsResult.value.consultations ?? []);
      }
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value || null);
      }
    }).finally(() => setLoading(false));
  }, []);

  // Today's overview metrics derived from slots
  const bookedCount = slots.filter((s) => s.isBooked).length;
  const availableCount = slots.filter((s) => !s.isBooked).length;

  // Unique patients today = patients who have an appointment on today's slots
  // Since we only have the slot list (not full appointment objects), we use
  // total patients as a reasonable proxy for the overview stat.
  // The booked slots count is the most accurate "today's patients" figure.
  const todayPatientsCount = bookedCount;

  // Quick Access: most recent 4 patients and 4 consultations
  const recentPatients = patients.slice(0, 4);
  const recentConsultations = consultations
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const doctorName = profile?.name || 'Doctor';
  const greeting = getGreeting();

  return (
    <div className="dashboard-page">
      <header className="page-heading">
        <h1>{greeting}, {doctorName}</h1>
        <p>Here is your schedule and patient overview for today.</p>
      </header>

      <div className="dashboard-grid">
        {/* Today's Appointments */}
        <Card className="appointments-card">
          <div className="card-heading">
            <h2>Today's Appointments</h2>
            <Button to="/doctor/appointments" variant="text">View All</Button>
          </div>
          {loading ? (
            <p className="loading-text">Loading appointments…</p>
          ) : slots.filter((s) => s.isBooked).length > 0 ? (
            <div className="dr-dash-slot-list">
              {slots.filter((s) => s.isBooked).map((slot) => (
                <div key={slot.id || slot._id} className="dr-dash-slot-item">
                  <CalendarDays size={15} aria-hidden="true" />
                  <span className="dr-dash-slot-time">
                    {slot.startTime}
                    {slot.endTime ? ` – ${slot.endTime}` : ''}
                  </span>
                  <span className="dr-dash-slot-label">Booked</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No appointments today"
              description="You do not have any booked consultations scheduled for today."
            />
          )}
        </Card>

        {/* Today's Overview */}
        <Card className="overview-card">
          <div className="card-heading">
            <h2>Today's Overview</h2>
          </div>
          <div className="overview-list">
            <div className="overview-item">
              <CalendarDays size={21} aria-hidden="true" />
              <strong>Booked</strong>
              <span>{loading ? '—' : bookedCount}</span>
            </div>
            <div className="overview-item">
              <Activity size={21} aria-hidden="true" />
              <strong>Available Slots</strong>
              <span>{loading ? '—' : availableCount}</span>
            </div>
            <div className="overview-item">
              <Users size={21} aria-hidden="true" />
              <strong>Patients</strong>
              <span>{loading ? '—' : todayPatientsCount}</span>
            </div>
          </div>
          <div className="overview-card__footer">
            <Button to="/doctor/schedule" variant="secondary" className="overview-card__manage-btn">
              Manage Schedule
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Access */}
      <section className="recent-section" aria-labelledby="quick-links-heading">
        <div className="section-heading">
          <h2 id="quick-links-heading">Quick Access</h2>
        </div>
        <div className="recent-grid">

          {/* Patients */}
          <Card>
            <div className="card-heading">
              <h3 className="dr-dash-card-title">Patients</h3>
              <Button to="/doctor/patients" variant="text">View All</Button>
            </div>
            {loading ? (
              <p className="loading-text">Loading…</p>
            ) : recentPatients.length > 0 ? (
              <ul className="dr-dash-list" aria-label="Recent patients">
                {recentPatients.map((patient) => {
                  const name = patient.fullName || '—';
                  const initial = name.charAt(0).toUpperCase();
                  const latestApt = patient.appointments?.[0];
                  const dateLabel = latestApt
                    ? formatRelativeDate(latestApt.date)
                    : null;
                  return (
                    <li key={patient._id} className="dr-dash-list__item">
                      <Link
                        to={`/doctor/patients/${patient._id}`}
                        className="dr-dash-list__link"
                      >
                        <span className="dr-dash-list__avatar">{initial}</span>
                        <span className="dr-dash-list__info">
                          <span className="dr-dash-list__name">{name}</span>
                          {dateLabel && (
                            <span className="dr-dash-list__meta">{dateLabel}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={Users}
                title="No patients yet"
                description="Your patients will appear here once appointments are booked."
              />
            )}
          </Card>

          {/* Consultations & Records */}
          <Card>
            <div className="card-heading">
              <h3 className="dr-dash-card-title">Consultations &amp; Records</h3>
              <Button to="/doctor/consultations" variant="text">View All</Button>
            </div>
            {loading ? (
              <p className="loading-text">Loading…</p>
            ) : recentConsultations.length > 0 ? (
              <ul className="dr-dash-list" aria-label="Recent consultations">
                {recentConsultations.map((c) => {
                  const patientName = c.patient?.fullName || '—';
                  const initial = patientName.charAt(0).toUpperCase();
                  const isCompleted = c.status === 'completed';
                  const dateLabel = formatDate(
                    isCompleted ? c.completedAt : c.createdAt
                  );
                  return (
                    <li key={c._id} className="dr-dash-list__item">
                      <Link
                        to={`/doctor/consultations/${c._id}`}
                        className="dr-dash-list__link"
                      >
                        <span className="dr-dash-list__avatar">{initial}</span>
                        <span className="dr-dash-list__info">
                          <span className="dr-dash-list__name">{patientName}</span>
                          <span className="dr-dash-list__meta">{dateLabel}</span>
                        </span>
                        <span
                          className={`dr-dash-list__badge dr-dash-list__badge--${isCompleted ? 'completed' : 'inprogress'}`}
                        >
                          {isCompleted ? 'Completed' : 'In progress'}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={FileText}
                title="No consultations yet"
                description="Your consultation history will appear here."
              />
            )}
          </Card>

          {/* Profile */}
          <Card>
            <div className="card-heading">
              <h3 className="dr-dash-card-title">Profile</h3>
              <Button to="/doctor/profile" variant="text">Edit</Button>
            </div>
            {loading ? (
              <p className="loading-text">Loading…</p>
            ) : profile ? (
              <div className="dr-dash-profile">
                <div className="dr-dash-profile__avatar">
                  {profile.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="dr-dash-profile__info">
                  <p className="dr-dash-profile__name">{profile.name}</p>
                  {profile.specialization && (
                    <p className="dr-dash-profile__spec">{profile.specialization}</p>
                  )}
                  {profile.qualifications && (
                    <p className="dr-dash-profile__qual">{profile.qualifications}</p>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={UserCog}
                title="Profile not set up"
                description="Contact an administrator to complete your profile."
              />
            )}
          </Card>

        </div>
      </section>
    </div>
  );
}

/**
 * Returns a time-appropriate greeting string.
 */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
