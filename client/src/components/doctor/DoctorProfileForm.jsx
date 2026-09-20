import { useState } from 'react';
import { updateMyProfile } from '../../services/doctorService';

const MAX_QUALIFICATIONS = 200;
const MAX_BIO = 1000;
const MAX_LANGUAGES = 10;
const MAX_LANGUAGE_LEN = 40;

/**
 * Editable doctor profile form.
 * Read-only block: name, email, specialization (administrator-managed).
 * Editable: experience, qualifications, languages (comma-separated), bio.
 *
 * @param {{ doctor: object, onSaved: (doctor: object) => void }} props
 */
export default function DoctorProfileForm({ doctor, onSaved }) {
  const [experience, setExperience] = useState(
    doctor.experience != null ? String(doctor.experience) : ''
  );
  const [qualifications, setQualifications] = useState(doctor.qualifications ?? '');
  const [languages, setLanguages] = useState(
    Array.isArray(doctor.languages) ? doctor.languages.join(', ') : ''
  );
  const [bio, setBio] = useState(doctor.bio ?? '');

  const [fieldError, setFieldError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  function validate() {
    if (experience !== '') {
      const n = Number(experience);
      if (!Number.isInteger(n) || n < 0 || n > 60) {
        return 'Experience must be a whole number between 0 and 60.';
      }
    }
    if (qualifications.length > MAX_QUALIFICATIONS) {
      return `Qualifications must be ${MAX_QUALIFICATIONS} characters or fewer.`;
    }
    if (bio.length > MAX_BIO) {
      return `Biography must be ${MAX_BIO} characters or fewer.`;
    }
    const langArray = languages
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);
    if (langArray.length > MAX_LANGUAGES) {
      return `You can enter up to ${MAX_LANGUAGES} languages.`;
    }
    for (const lang of langArray) {
      if (lang.length > MAX_LANGUAGE_LEN) {
        return `Each language must be ${MAX_LANGUAGE_LEN} characters or fewer.`;
      }
    }
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFieldError('');
    setSuccessMsg('');

    const validationError = validate();
    if (validationError) {
      setFieldError(validationError);
      return;
    }

    const payload = {};
    if (experience !== '') payload.experience = Number(experience);
    if (qualifications !== (doctor.qualifications ?? '')) payload.qualifications = qualifications;
    if (bio !== (doctor.bio ?? '')) payload.bio = bio;

    // Build de-duplicated languages array
    const langArray = [...new Set(
      languages.split(',').map((l) => l.trim()).filter(Boolean)
    )];
    payload.languages = langArray;

    setSaving(true);
    try {
      const updated = await updateMyProfile(payload);
      setSuccessMsg('Profile updated.');
      onSaved(updated);
    } catch (err) {
      setFieldError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dr-self-profile">
      {/* ── Read-only block ── */}
      <div className="dr-self-profile__readonly">
        <div className="dr-self-profile__readonly-header">
          <div className="dr-self-profile__avatar" aria-hidden="true">
            {doctor.name ? doctor.name.charAt(0).toUpperCase() : 'D'}
          </div>
          <div>
            <p className="dr-self-profile__name">{doctor.name}</p>
            <span className="doctor-card__spec-badge">{doctor.specialization}</span>
          </div>
        </div>
        <dl className="dr-self-profile__readonly-details">
          <div className="dr-self-profile__readonly-row">
            <dt>Email</dt>
            <dd>{doctor.email ?? '—'}</dd>
          </div>
        </dl>
        <p className="dr-self-profile__admin-note">
          Name, email and specialization are managed by your administrator.
        </p>
      </div>

      {/* ── Editable form ── */}
      <form className="dr-self-profile__form" onSubmit={handleSubmit} noValidate>
        {fieldError && <p className="dr-self-profile__error" role="alert">{fieldError}</p>}
        {successMsg && <p className="dr-self-profile__success" role="status">{successMsg}</p>}

        <div className="dr-self-profile__field">
          <label className="dr-self-profile__label" htmlFor="dp-experience">
            Years of experience
          </label>
          <input
            id="dp-experience"
            type="number"
            className="dr-self-profile__input dr-self-profile__input--small"
            min={0}
            max={60}
            placeholder="e.g. 5"
            value={experience}
            onChange={(e) => { setExperience(e.target.value); setSuccessMsg(''); }}
          />
        </div>

        <div className="dr-self-profile__field">
          <label className="dr-self-profile__label" htmlFor="dp-qualifications">
            Qualifications
            <span className="dr-self-profile__hint">({qualifications.length}/{MAX_QUALIFICATIONS})</span>
          </label>
          <input
            id="dp-qualifications"
            type="text"
            className="dr-self-profile__input"
            placeholder="e.g. MBBS, MD (Cardiology)"
            maxLength={MAX_QUALIFICATIONS}
            value={qualifications}
            onChange={(e) => { setQualifications(e.target.value); setSuccessMsg(''); }}
          />
        </div>

        <div className="dr-self-profile__field">
          <label className="dr-self-profile__label" htmlFor="dp-languages">
            Languages spoken
            <span className="dr-self-profile__hint">Comma-separated, e.g. English, Hindi</span>
          </label>
          <input
            id="dp-languages"
            type="text"
            className="dr-self-profile__input"
            placeholder="English, Hindi, Marathi"
            value={languages}
            onChange={(e) => { setLanguages(e.target.value); setSuccessMsg(''); }}
          />
        </div>

        <div className="dr-self-profile__field">
          <label className="dr-self-profile__label" htmlFor="dp-bio">
            About you
            <span className="dr-self-profile__hint">({bio.length}/{MAX_BIO})</span>
          </label>
          <textarea
            id="dp-bio"
            className="dr-self-profile__textarea"
            placeholder="A brief description for patients about your background and approach."
            maxLength={MAX_BIO}
            rows={4}
            value={bio}
            onChange={(e) => { setBio(e.target.value); setSuccessMsg(''); }}
          />
        </div>

        <div className="dr-self-profile__actions">
          <button type="submit" className="button" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
