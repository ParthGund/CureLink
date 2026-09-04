import { CalendarClock, History } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';



export default function PatientAppointments() {
  return <div><header className="page-heading page-heading--with-action"><div><h1>Appointments</h1><p>Manage your upcoming and past consultations.</p></div><Button to="/patient/appointments/book">Book Appointment</Button></header><div className="two-column-page"><section><h2>Upcoming Appointments</h2><Card><EmptyState icon={CalendarClock} title="No upcoming appointments" description="Your scheduled consultations will appear here once booked." /></Card></section><section><h2>Past Appointments</h2><Card><EmptyState icon={History} title="No past appointments" description="Your consultation history will appear here." /></Card></section></div></div>;
}
