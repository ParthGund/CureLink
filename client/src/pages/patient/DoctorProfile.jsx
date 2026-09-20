import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import DoctorAvailability from '../../components/patient/DoctorAvailability';
import { getDoctorById, getDoctorAvailability } from '../../services/doctorService';

export default function DoctorProfile() {
  const { doctorId } = useParams();

  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    setError('');

    Promise.all([
      getDoctorById(doctorId),
      getDoctorAvailability(doctorId),
    ])
      .then(([doc, avail]) => {
        setDoctor(doc);
        setAvailability(avail ?? []);
      })
      .catch((err) => {
        if (err.status === 404) {
          setNotFound(true);
        } else {
          setError(err.message || "Unable to load this doctor\u2019s profile. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [doctorId]);

  const initial = doctor?.name ? doctor.name.charAt(0).toUpperCase() : 'D';

  return (
    <div className="doctor-profile-page">
      {/* Back link */}
      <nav aria-label="Breadcrumb">
        <Button to="/patient/doctors" variant="text" className="doctor-profile__back">
          <ChevronLeft size={16} aria-hidden="true" />
          All doctors
        </Button>
      </nav>

      {/* Loading */}
      {loading && (
        <p className="loading-text">Loading doctor profile…</p>
      )}

      {/* Not found */}
      {!loading && notFound && (
        <Card className="doctor-profile__not-found-card">
          <EmptyState
            icon={CalendarDays}
            title="Doctor not found"
            description="This doctor's profile is no longer available."
            action={<Button to="/patient/doctors" variant="secondary">Back to doctors</Button>}
          />
        </Card>
      )}

      {/* Request error */}
      {!loading && error && (
        <div className="doctors-error">
          <p className="doctors-error__msg">{error}</p>
          <Button to="/patient/doctors" variant="secondary">Back to doctors</Button>
        </div>
      )}

      {/* Profile content */}
      {!loading && doctor && (
        <>
          {/* Profile card */}
          <Card className="doctor-profile__card">
            <div className="doctor-profile__header">
              <div className="doctor-profile__avatar" aria-hidden="true">{initial}</div>
              <div className="doctor-profile__identity">
                <h1 className="doctor-profile__name">{doctor.name}</h1>
                <span className="doctor-card__spec-badge">{doctor.specialization}</span>
              </div>
            </div>

            <dl className="doctor-profile__details">
              {typeof doctor.experience === 'number' && (
                <div className="doctor-profile__row">
                  <dt>Experience</dt>
                  <dd>{doctor.experience} {doctor.experience === 1 ? 'year' : 'years'}</dd>
                </div>
              )}
              {doctor.qualifications && (
                <div className="doctor-profile__row">
                  <dt>Qualifications</dt>
                  <dd>{doctor.qualifications}</dd>
                </div>
              )}
              {doctor.languages && doctor.languages.length > 0 && (
                <div className="doctor-profile__row">
                  <dt>Languages</dt>
                  <dd>{doctor.languages.join(', ')}</dd>
                </div>
              )}
            </dl>

            {doctor.bio && (
              <p className="doctor-profile__bio">{doctor.bio}</p>
            )}

            <div className="doctor-profile__action">
              <Button to="/patient/appointments/book">Book an Appointment</Button>
            </div>
          </Card>

          {/* Availability card */}
          <Card className="doctor-profile__avail-card">
            <div className="doctor-profile__avail-header">
              <h2>Available times</h2>
            </div>
            {availability.length > 0 ? (
              <div className="doctor-profile__avail-body">
                <DoctorAvailability availability={availability} />
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No available times"
                description="This doctor hasn't opened any appointment times yet. Please check back soon."
              />
            )}
          </Card>
        </>
      )}
    </div>
  );
}
