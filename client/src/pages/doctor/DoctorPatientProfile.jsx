import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, CalendarDays, History, ClipboardList } from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getMyPatientById } from '../../services/doctorService';
import { useToast } from '../../context/ToastContext';

export default function DoctorPatientProfile() {
  const { patientId } = useParams();
  const toast = useToast();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPatientById(patientId)
      .then((data) => setPatient(data))
      .catch((err) => toast.error(err.message || 'Failed to load patient details.'))
      .finally(() => setLoading(false));
  }, [patientId, toast]);

  if (loading) {
    return (
      <div>
        <Link to="/doctor/patients" className="button button--secondary" style={{ display: 'inline-flex', marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Patients
        </Link>
        <div className="skeleton-line" style={{ height: '40px', width: '250px', marginBottom: '20px' }} />
        <Card>
          <div className="skeleton-line" style={{ height: '20px', width: '50%', marginBottom: '10px' }} />
          <div className="skeleton-line" style={{ height: '20px', width: '40%', marginBottom: '10px' }} />
          <div className="skeleton-line" style={{ height: '20px', width: '60%' }} />
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div>
        <Link to="/doctor/patients" className="button button--secondary" style={{ display: 'inline-flex', marginBottom: '20px' }}>
          <ArrowLeft size={16} /> Back to Patients
        </Link>
        <EmptyState icon={User} title="Patient not found" description="The requested patient profile could not be loaded." />
      </div>
    );
  }

  const { fullName, email, phone, gender, dateOfBirth, appointments = [] } = patient;

  return (
    <div>
      <Link to="/doctor/patients" className="button button--secondary" style={{ display: 'inline-flex', marginBottom: '24px' }}>
        <ArrowLeft size={16} style={{ marginRight: '6px' }} /> Back to Patients
      </Link>

      <header className="page-heading">
        <h1>{fullName}</h1>
        <p>Patient Profile & Appointment History</p>
      </header>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginTop: '24px' }}>
        {/* Patient Details Card */}
        <Card>
          <div className="card-heading">
            <h2 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} className="text-teal" /> Personal Details
            </h2>
          </div>
          <dl className="dr-apt-detail__fields" style={{ padding: '0' }}>
            <div className="dr-apt-detail__row">
              <dt><Mail size={15} aria-hidden="true" /> Email</dt>
              <dd>{email || '—'}</dd>
            </div>
            <div className="dr-apt-detail__row">
              <dt><Phone size={15} aria-hidden="true" /> Phone</dt>
              <dd>{phone || '—'}</dd>
            </div>
            <div className="dr-apt-detail__row">
              <dt><User size={15} aria-hidden="true" /> Gender</dt>
              <dd style={{ textTransform: 'capitalize' }}>{gender || '—'}</dd>
            </div>
            <div className="dr-apt-detail__row">
              <dt><CalendarDays size={15} aria-hidden="true" /> Date of Birth</dt>
              <dd>
                {dateOfBirth
                  ? new Date(dateOfBirth).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Medical History Card */}
        <Card>
          <div className="card-heading">
            <h2 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ClipboardList size={18} className="text-teal" /> Medical History
            </h2>
          </div>
          <dl className="dr-apt-detail__fields" style={{ padding: '0' }}>
            <div className="dr-apt-detail__row">
              <dt>Allergies</dt>
              <dd>{patient.allergies || 'None reported'}</dd>
            </div>
            <div className="dr-apt-detail__row">
              <dt>Chronic Conditions</dt>
              <dd>{patient.chronicConditions || 'None reported'}</dd>
            </div>
            <div className="dr-apt-detail__row">
              <dt>Past Surgeries</dt>
              <dd>{patient.surgeries || 'None reported'}</dd>
            </div>
            <div className="dr-apt-detail__row">
              <dt>Current Medications</dt>
              <dd>{patient.currentMedications || 'None reported'}</dd>
            </div>
          </dl>
        </Card>

        {/* Appointment History Card */}
        <Card>
          <div className="card-heading">
            <h2 style={{ fontSize: '16px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History size={18} className="text-teal" /> Appointment History
            </h2>
          </div>
          
          {appointments.length > 0 ? (
            <div className="dr-apt-table-wrap">
              <table className="dr-apt-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt._id}>
                      <td>
                        {new Date(apt.date).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td>{apt.timeSlot || '—'}</td>
                      <td>
                        <span className={`dr-apt-status dr-apt-status--${apt.status}`}>
                          {apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState icon={History} title="No history found" description="This patient has no appointment history with you." />
          )}
        </Card>
      </div>
    </div>
  );
}
