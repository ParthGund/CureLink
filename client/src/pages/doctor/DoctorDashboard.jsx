import { useEffect, useState } from 'react';
import { CalendarDays, Users, FileText, ClipboardPlus, Calendar, Activity } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getMySlots } from '../../services/doctorService';

const overviewItems = [
  { label: 'Appointments', icon: CalendarDays },
  { label: 'Patients', icon: Users },
  { label: 'Consultations', icon: ClipboardPlus },
];

export default function DoctorDashboard() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    getMySlots({ from: todayString, to: todayString })
      .then((data) => {
        setSlots(data || []);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, []);

  const bookedSlots = slots.filter((slot) => slot.isBooked);
  const availableSlots = slots.filter((slot) => !slot.isBooked);

  return (
    <div className="dashboard-page">
      <header className="page-heading">
        <h1>Good morning, Doctor</h1>
        <p>Here is your schedule and patient overview for today.</p>
      </header>

      <div className="dashboard-grid">
        <Card className="appointments-card">
          <div className="card-heading">
            <h2>Today's Appointments</h2>
            <Button to="/doctor/appointments" variant="text">View All</Button>
          </div>
          {loading ? (
            <p className="loading-text">Loading appointments…</p>
          ) : bookedSlots.length > 0 ? (
            <div className="slot-list">
              {bookedSlots.map((slot) => (
                <div key={slot.id} className="slot-item">
                  <strong>{slot.startTime} - {slot.endTime}</strong>
                  <span>Booked Consultation</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No appointments today"
              description="You do not have any booked consultations for today."
            />
          )}
        </Card>

        <Card className="overview-card">
          <div className="card-heading">
            <h2>Today's Overview</h2>
          </div>
          <div className="overview-list">
            <div className="overview-item">
              <CalendarDays size={21} aria-hidden="true" />
              <strong>Booked</strong>
              <span>{loading ? '-' : bookedSlots.length}</span>
            </div>
            <div className="overview-item">
              <Activity size={21} aria-hidden="true" />
              <strong>Available Slots</strong>
              <span>{loading ? '-' : availableSlots.length}</span>
            </div>
            <div className="overview-item">
              <Users size={21} aria-hidden="true" />
              <strong>Patients</strong>
              <span>-</span>
            </div>
          </div>
          <div style={{ marginTop: '24px' }}>
             <Button to="/doctor/schedule" variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>Manage Schedule</Button>
          </div>
        </Card>
      </div>

      <section className="recent-section" aria-labelledby="quick-links-heading">
        <div className="section-heading">
          <h2 id="quick-links-heading">Quick Access</h2>
        </div>
        <div className="recent-grid">
          <Card>
            <div className="card-heading">
              <h3 style={{ fontSize: '18px', margin: 0 }}>Patients</h3>
              <Button to="/doctor/patients" variant="text">View All</Button>
            </div>
            <EmptyState icon={Users} title="No recent patients" description="Your recently viewed patients will appear here." />
          </Card>
          <Card>
            <div className="card-heading">
              <h3 style={{ fontSize: '18px', margin: 0 }}>Consultations & Records</h3>
              <Button to="/doctor/consultations" variant="text">View All</Button>
            </div>
            <EmptyState icon={FileText} title="No recent consultations" description="Your consultation history and medical records will appear here." />
          </Card>
          <Card>
            <div className="card-heading">
              <h3 style={{ fontSize: '18px', margin: 0 }}>Profile</h3>
              <Button to="/doctor/profile" variant="text">Edit</Button>
            </div>
            <EmptyState icon={ClipboardPlus} title="Doctor Profile" description="Manage your professional details and qualifications." />
          </Card>
        </div>
      </section>
    </div>
  );
}
