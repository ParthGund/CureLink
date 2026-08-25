import { ClipboardPlus, FileText, FolderOpen, FlaskConical, CalendarCheck, Pill } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';

const overviewItems = [
  { label: 'Consultations', icon: ClipboardPlus },
  { label: 'Prescriptions', icon: Pill },
  { label: 'Lab Results', icon: FlaskConical },
];

export default function PatientDashboard() {
  return (
    <div className="dashboard-page">
      <header className="page-heading">
        <h1>Welcome back.</h1>
        <p>Your healthcare information, appointments, and medical records will appear here.</p>
      </header>
      <div className="dashboard-grid">
        <Card className="appointments-card">
          <div className="card-heading">
            <h2>Upcoming Appointments</h2>
            <Button to="/patient/appointments" variant="text">View All</Button>
          </div>
          <EmptyState
            icon={CalendarCheck}
            title="No upcoming appointments"
            description="Your scheduled appointments will appear here."
            action={<Button to="/patient/appointments/book">Book an Appointment</Button>}
          />
        </Card>
        <Card className="overview-card">
          <div className="card-heading"><h2>Health Overview</h2></div>
          <div className="overview-list">
            {overviewItems.map(({ label, icon: Icon }) => (
              <div className="overview-item" key={label}><Icon size={21} aria-hidden="true" /><strong>{label}</strong><span>No data</span></div>
            ))}
          </div>
        </Card>
      </div>
      <section className="recent-section" aria-labelledby="recent-heading">
        <div className="section-heading">
          <h2 id="recent-heading">Recent Medical History</h2>
          <Button to="/patient/medical-history" variant="text">View All</Button>
        </div>
        <div className="recent-grid">
          <Card><EmptyState icon={FolderOpen} title="No medical records yet" description="Your consultation history will appear here." /></Card>
          <Card><EmptyState icon={FileText} title="No prescriptions yet" description="Your active prescriptions will appear here." /></Card>
        </div>
      </section>
    </div>
  );
}
