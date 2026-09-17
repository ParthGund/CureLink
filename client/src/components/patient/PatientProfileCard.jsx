import { Mail, Phone, Calendar, Droplets, User } from 'lucide-react';

/**
 * Displays the patient's profile information in a clean card layout.
 *
 * @param {object} props
 * @param {object} props.user        - User object from AuthContext (name, email, role, createdAt).
 * @param {object} [props.patient]   - Optional Patient document with extended details (phone, gender, dateOfBirth).
 * @param {function} [props.onEdit]  - Called when the Edit Profile button is clicked.
 */
export default function PatientProfileCard({ user, patient, onEdit }) {
  const initial = user.name ? user.name.charAt(0).toUpperCase() : '?';

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const roleLabel = user.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : 'Patient';

  const phone = patient?.phone || 'Not specified';
  const gender = patient?.gender
    ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).replace('_', ' ')
    : 'Not specified';
  const bloodGroup = patient?.bloodGroup || 'Not specified';

  const age = patient?.dateOfBirth
    ? String(Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000))
    : 'Not specified';

  return (
    <div className="profile-card">
      <div className="profile-card__header">
        <div className="profile-card__avatar">{initial}</div>
        <div className="profile-card__identity">
          <h2 className="profile-card__name">{user.name}</h2>
          <span className="profile-card__role-badge">{roleLabel}</span>
        </div>
      </div>

      <dl className="profile-card__details">
        <div className="profile-card__row">
          <dt><Mail size={16} aria-hidden="true" /> Email</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="profile-card__row">
          <dt><Phone size={16} aria-hidden="true" /> Phone</dt>
          <dd>{phone}</dd>
        </div>
        <div className="profile-card__row">
          <dt><User size={16} aria-hidden="true" /> Gender</dt>
          <dd>{gender}</dd>
        </div>
        <div className="profile-card__row">
          <dt><User size={16} aria-hidden="true" /> Age</dt>
          <dd>{age}</dd>
        </div>
        <div className="profile-card__row">
          <dt><Droplets size={16} aria-hidden="true" /> Blood Group</dt>
          <dd>{bloodGroup}</dd>
        </div>
        <div className="profile-card__row">
          <dt><Calendar size={16} aria-hidden="true" /> Member Since</dt>
          <dd>{memberSince}</dd>
        </div>
      </dl>

      {onEdit && (
        <div className="profile-card__actions">
          <button type="button" className="button" onClick={onEdit}>
            Edit Profile
          </button>
        </div>
      )}
    </div>
  );
}
