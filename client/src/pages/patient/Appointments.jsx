import { useEffect, useState } from 'react';
import { CalendarClock, History } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import AppointmentList from '../../components/patient/AppointmentList';
import { getMyAppointments, cancelAppointment } from '../../services/appointmentService';

export default function PatientAppointments() {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);

  function fetchAppointments() {
    setLoading(true);
    getMyAppointments()
      .then((data) => {
        setUpcoming(data.upcoming ?? []);
        setPast(data.past ?? []);
      })
      .catch(() => {
        setUpcoming([]);
        setPast([]);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

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
        <Button to="/patient/appointments/book">Book Appointment</Button>
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
    </div>
  );
}
