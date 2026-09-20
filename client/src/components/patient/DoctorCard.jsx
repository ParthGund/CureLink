import { Link } from 'react-router-dom';

/**
 * Displays a single doctor's summary for the browse grid.
 * @param {{ doctor: object }} props
 */
export default function DoctorCard({ doctor }) {
  const initial = doctor.name ? doctor.name.charAt(0).toUpperCase() : 'D';

  return (
    <div className="doctor-card">
      <div className="doctor-card__avatar" aria-hidden="true">{initial}</div>
      <div className="doctor-card__body">
        <p className="doctor-card__spec-badge">{doctor.specialization}</p>
        <h3 className="doctor-card__name">{doctor.name}</h3>
        {typeof doctor.experience === 'number' && (
          <p className="doctor-card__meta">
            {doctor.experience} {doctor.experience === 1 ? 'year' : 'years'} experience
          </p>
        )}
        {doctor.qualifications && (
          <p className="doctor-card__qualifications">{doctor.qualifications}</p>
        )}
      </div>
      <Link
        className="doctor-card__link button button--secondary"
        to={`/patient/doctors/${doctor._id}`}
        aria-label={`View profile of ${doctor.name}`}
      >
        View profile
      </Link>
    </div>
  );
}
