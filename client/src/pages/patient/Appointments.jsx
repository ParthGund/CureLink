import { useEffect, useState, useCallback } from 'react';
import { CalendarClock, History, Ban } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import AppointmentList from '../../components/patient/AppointmentList';
import { getMyAppointments, cancelAppointment } from '../../services/appointmentService';

/**
 * Normalises an appointment date (handles both `date` and `appointmentDate` fields)
 * and zeros out the time portion for accurate day-level comparison.
 */
function getAppointmentDay(apt) {
  const raw = apt.appointmentDate || apt.date;
  if (!raw) return 0;
  const d = new Date(raw);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function PatientAppointments() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [cancelled, setCancelled] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = useCallback(() => {
    setLoading(true);
    getMyAppointments()
      .then((data) => {
        const all = data.appointments ?? [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMs = today.getTime();

        const upcomingList = [];
        const pastList = [];
        const cancelledList = [];

        for (const apt of all) {
          if (apt.status === 'cancelled') {
            cancelledList.push(apt);
          } else if (getAppointmentDay(apt) >= todayMs && apt.status !== 'completed') {
            upcomingList.push(apt);
          } else {
            pastList.push(apt);
          }
        }

        // Upcoming sorted ascending (soonest first)
        upcomingList.sort((a, b) => getAppointmentDay(a) - getAppointmentDay(b));

        setUpcoming(upcomingList);
        setPast(pastList);
        setCancelled(cancelledList);
      })
      .catch(() => {
        setUpcoming([]);
        setPast([]);
        setCancelled([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  async function handleCancel(id) {
    try {
      await cancelAppointment(id);
      fetchAppointments();
    } catch {
      // Error is already handled by the API layer; refresh to show current state
      fetchAppointments();
    }
  }

  return (
    <div>
      <header className="page-heading page-heading--with-action">
        <div>
          <h1>Appointments</h1>
          <p>Manage your upcoming and past consultations.</p>
        </div>
        <div className="page-heading__actions">
          <Button to="/patient/doctors" variant="secondary">Find a Doctor</Button>
          <Button to="/patient/appointments/book">Book Appointment</Button>
        </div>
      </header>

      <div className="two-column-page">
        <section>
          <h2>Upcoming Appointments</h2>
          {loading ? (
            <Card><p className="loading-text">Loading appointments…</p></Card>
          ) : upcoming.length > 0 ? (
            <AppointmentList appointments={upcoming} onCancel={handleCancel} />
          ) : (
            <Card>
              <EmptyState
                icon={CalendarClock}
                title="No upcoming appointments"
                description="Your scheduled consultations will appear here once booked."
              />
            </Card>
          )}
        </section>

        <section>
          <h2>Past Appointments</h2>
          {loading ? (
            <Card><p className="loading-text">Loading appointments…</p></Card>
          ) : past.length > 0 ? (
            <AppointmentList appointments={past} />
          ) : (
            <Card>
              <EmptyState
                icon={History}
                title="No past appointments"
                description="Your consultation history will appear here."
              />
            </Card>
          )}
        </section>
      </div>

      {!loading && cancelled.length > 0 && (
        <section className="cancelled-section">
          <h2>Cancelled Appointments</h2>
          <AppointmentList appointments={cancelled} />
        </section>
      )}
    </div>
  );
}
