import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from "../../context/ToastContext";
import {
  CalendarDays, Users, FileText, Activity, UserCog, Clock, CheckCircle2
} from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getDoctorDashboard, getMyPatients, getMyProfile } from '../../services/doctorService';
import { getDoctorConsultations, startConsultation } from '../../services/consultationService';

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
  const [dashboardData, setDashboardData] = useState({ metrics: {}, todaySchedule: [] });
  const [patients, setPatients] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const todayString = toLocalDateString(new Date());

    Promise.allSettled([
      getDoctorDashboard(todayString),
      getMyPatients(),
      getDoctorConsultations(),
      getMyProfile(),
    ]).then(([dashboardResult, patientsResult, consultationsResult, profileResult]) => {
      if (dashboardResult.status === 'fulfilled') {
        setDashboardData(dashboardResult.value || { metrics: {}, todaySchedule: [] });
      }
      if (patientsResult.status === 'fulfilled') {
        setPatients(patientsResult.value || []);
      }
      if (consultationsResult.status === 'fulfilled') {
        setConsultations(consultationsResult.value?.consultations ?? []);
      }
      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value || null);
      }
    }).finally(() => setLoading(false));
  }, []);

  const { metrics = {}, todaySchedule = [] } = dashboardData ?? {};
  const bookedCount = metrics.totalAppointmentsToday ?? 0;
  const upcomingCount = metrics.upcomingAppointments ?? 0;
  const completedCount = metrics.completedConsultations ?? 0;
  const activePatientsCount = metrics.activePatientsCount ?? 0;

  // Quick Access: most recent 4 patients and 4 consultations
  const recentPatients = patients.slice(0, 4);
  const recentConsultations = consultations
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const doctorName = profile?.name || 'Doctor';
  const greeting = getGreeting();

  async function handleConsultationClick(apt) {
    if (apt.consultationId) {
      navigate(`/doctor/consultations/${apt.consultationId}`);
      return;
    }
    
    setStartingId(apt._id);
    try {
      const data = await startConsultation(apt._id);
      navigate(`/doctor/consultations/${data.consultation._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to start consultation.');
    } finally {
      setStartingId(null);
    }
  }

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
          ) : todaySchedule.length > 0 ? (
            <div className="dr-dash-slot-list">
              {todaySchedule.map((apt) => {
                let badgeLabel = 'Upcoming';
                let badgeClass = 'dr-dash-list__badge--upcoming';
                let linkLabel = 'Start Consultation';
                let isComplete = false;
                
                if (apt.consultationStatus === 'completed' || apt.status === 'completed') {
                  badgeLabel = 'Completed';
                  badgeClass = 'dr-dash-list__badge--completed';
                  linkLabel = 'View Record';
                  isComplete = true;
                } else if (apt.consultationStatus === 'in_progress') {
                  badgeLabel = 'In Progress';
                  badgeClass = 'dr-dash-list__badge--inprogress';
                  linkLabel = 'Resume';
                }
                
                const isStarting = startingId === apt._id;

                return (
                  <div key={apt._id} className="dr-dash-slot-item">
                    <div className="dr-dash-slot-item__info">
                      <span className="dr-dash-slot-time">
                        {isComplete ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                        {apt.timeSlot}
                      </span>
                      <span className="dr-dash-slot-patient">{apt.patientName}</span>
                    </div>
                    <div className="dr-dash-slot-item__actions">
                      <span className={`dr-dash-list__badge ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <Button
                        type="button"
                        variant="text"
                        onClick={() => handleConsultationClick(apt)}
                        disabled={isStarting}
                      >
                        {isStarting ? 'Starting...' : linkLabel}
                      </Button>
                    </div>
                  </div>
                );
              })}
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
              <strong>Today's Bookings</strong>
              <span>{loading ? '—' : bookedCount}</span>
            </div>
            <div className="overview-item">
              <Activity size={21} aria-hidden="true" />
              <strong>Upcoming Overall</strong>
              <span>{loading ? '—' : upcomingCount}</span>
            </div>
            <div className="overview-item">
              <Users size={21} aria-hidden="true" />
              <strong>Active Patients</strong>
              <span>{loading ? '—' : activePatientsCount}</span>
            </div>
            <div className="overview-item">
              <FileText size={21} aria-hidden="true" />
              <strong>Consultations</strong>
              <span>{loading ? '—' : completedCount}</span>
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