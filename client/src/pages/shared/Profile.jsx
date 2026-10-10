import { useState, useEffect } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

/** Fields displayed for a patient profile. */
const PATIENT_FIELDS = [
  { key: 'name',        label: 'Full Name',    type: 'text',   placeholder: 'e.g. Jane Doe',          section: 'basic' },
  { key: 'phone',       label: 'Phone',        type: 'tel',    placeholder: 'e.g. +91 98765 43210',   section: 'basic' },
  { key: 'dateOfBirth', label: 'Date of Birth', type: 'date',  placeholder: '',                        section: 'basic' },
  {
    key: 'gender', label: 'Gender', type: 'select', placeholder: '', section: 'basic',
    options: [
      { value: '',              label: 'Select gender' },
      { value: 'male',          label: 'Male' },
      { value: 'female',        label: 'Female' },
      { value: 'other',         label: 'Other' },
      { value: 'prefer_not_to_say', label: 'Prefer not to say' },
    ],
  },
  {
    key: 'bloodGroup', label: 'Blood Group', type: 'select', placeholder: '', section: 'basic',
    options: [
      { value: '',      label: 'Select blood group' },
      { value: 'A+',    label: 'A+' },
      { value: 'A-',    label: 'A−' },
      { value: 'B+',    label: 'B+' },
      { value: 'B-',    label: 'B−' },
      { value: 'AB+',   label: 'AB+' },
      { value: 'AB-',   label: 'AB−' },
      { value: 'O+',    label: 'O+' },
      { value: 'O-',    label: 'O−' },
    ],
  },
  { key: 'address',     label: 'Address',      type: 'textarea', placeholder: 'Street, City, State, PIN',        section: 'basic' },
  { key: 'allergies',   label: 'Allergies',    type: 'textarea', placeholder: 'e.g. Penicillin, Peanuts (leave blank if none)', section: 'medical' },
  { key: 'chronicConditions', label: 'Chronic Conditions', type: 'textarea', placeholder: 'e.g. Asthma, Hypertension', section: 'medical' },
  { key: 'surgeries',   label: 'Past Surgeries', type: 'textarea', placeholder: 'e.g. Appendectomy 2015',        section: 'medical' },
  { key: 'currentMedications', label: 'Current Medications', type: 'textarea', placeholder: 'e.g. Metformin 500mg daily', section: 'medical' },
];

/** Fields displayed for a doctor profile. */
const DOCTOR_FIELDS = [
  { key: 'name',           label: 'Full Name',       type: 'text', placeholder: 'e.g. Dr. Rajesh Kumar',  section: 'basic' },
  { key: 'phone',          label: 'Phone',           type: 'tel',  placeholder: 'e.g. +91 98765 43210',   section: 'basic' },
  { key: 'specialization', label: 'Specialization',  type: 'text', placeholder: 'e.g. Cardiology',        section: 'professional' },
  { key: 'qualifications', label: 'Qualifications',  type: 'text', placeholder: 'e.g. MBBS, MD',          section: 'professional' },
];

/** Fields displayed for an admin profile. */
const ADMIN_FIELDS = [
  { key: 'name',  label: 'Full Name', type: 'text', placeholder: 'e.g. Admin User', section: 'basic' },
  { key: 'phone', label: 'Phone',     type: 'tel',  placeholder: 'e.g. +91 98765 43210', section: 'basic' },
];

/** Section headings per role. */
const SECTION_HEADINGS = {
  basic:        'Personal Information',
  medical:      'Medical History',
  professional: 'Professional Details',
};

/**
 * Build the initial form-data object from the user record, scoped
 * to the keys defined for the active role's field list.
 */
function buildFormData(user, fields) {
  const data = {};
  for (const { key } of fields) {
    // Check root user, then nested patient/doctor profile
    const raw = user?.[key] ?? user?.patient?.[key] ?? user?.doctor?.[key] ?? '';
    // Dates arrive as ISO strings — extract YYYY-MM-DD for the <input type="date">
    data[key] = key === 'dateOfBirth' && raw ? raw.slice(0, 10) : raw;
  }
  return data;
}

/** Choose the field list for the given role. */
function getFieldsForRole(role) {
  if (role === 'doctor') return DOCTOR_FIELDS;
  if (role === 'admin')  return ADMIN_FIELDS;
  return PATIENT_FIELDS;
}

export default function Profile({ role }) {
  const { user, loading: authLoading, updateProfile } = useAuth();
  const toast = useToast();

  const effectiveRole = role || user?.role || 'patient';
  const fields = getFieldsForRole(effectiveRole);

  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [formData, setFormData] = useState(() => buildFormData(user, fields));

  // Sync form when user data arrives or changes (e.g. after login hydration)
  useEffect(() => {
    if (user) setFormData(buildFormData(user, fields));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(key, value) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handleCancel() {
    setFormData(buildFormData(user, fields));
    setEditing(false);
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!formData.name?.trim()) {
      toast.error('Full Name is required.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Render helpers ──────────────────────────────────────────
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : '?';

  const roleLabel = effectiveRole.charAt(0).toUpperCase() + effectiveRole.slice(1);

  // Group fields by section to render with headings
  const sections = [];
  let currentSection = null;
  for (const field of fields) {
    const sec = field.section || 'basic';
    if (sec !== currentSection) {
      sections.push({ key: sec, heading: SECTION_HEADINGS[sec] || sec, fields: [] });
      currentSection = sec;
    }
    sections[sections.length - 1].fields.push(field);
  }

  return (
    <div>
      <header className="page-heading">
        <h1>Profile</h1>
        <p>Manage your {effectiveRole} profile information.</p>
      </header>

      <Card className="profile-page-card">
        {authLoading ? (
          <p className="loading-text">Loading profile…</p>
        ) : user ? (
          <form className="profile-form" onSubmit={handleSave}>
            {/* ── Header with avatar ─────────────────────────── */}
            <div className="profile-card__header">
              <div className="profile-card__avatar">{initial}</div>
              <div className="profile-card__identity">
                <h2 className="profile-card__name">{user.name}</h2>
                <span className="profile-card__role-badge">{roleLabel}</span>
              </div>
            </div>

            {/* ── Sections with headings ──────────────────────── */}
            {sections.map((section) => (
              <div key={section.key} className="profile-form__section">
                {sections.length > 1 && (
                  <h3 className="profile-form__section-heading">{section.heading}</h3>
                )}
                <div className="profile-form__fields">
                  {section.fields.map(({ key, label, type, placeholder, options }) => (
                    <div className="profile-form__field" key={key}>
                      <label className="profile-form__label" htmlFor={`profile-${key}`}>
                        {label}
                      </label>

                      {!editing ? (
                        <span className="profile-form__value">
                          {formatDisplayValue(key, formData[key], options)}
                        </span>
                      ) : type === 'select' ? (
                        <select
                          id={`profile-${key}`}
                          className="profile-form__input"
                          value={formData[key]}
                          onChange={(e) => handleChange(key, e.target.value)}
                        >
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : type === 'textarea' ? (
                        <textarea
                          id={`profile-${key}`}
                          className="profile-form__input profile-form__input--textarea"
                          rows={3}
                          placeholder={placeholder}
                          value={formData[key]}
                          onChange={(e) => handleChange(key, e.target.value)}
                        />
                      ) : (
                        <input
                          id={`profile-${key}`}
                          className="profile-form__input"
                          type={type}
                          placeholder={placeholder}
                          value={formData[key]}
                          onChange={(e) => handleChange(key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* ── Email (always read-only) ────────────────────── */}
            <div className="profile-form__field">
              <label className="profile-form__label">Email</label>
              <span className="profile-form__value">{user.email}</span>
            </div>

            {/* ── Actions ─────────────────────────────────────── */}
            <div className="profile-form__actions">
              {editing ? (
                <>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 size={16} className="spin-icon" /> : <Save size={16} />}
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button type="button" onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        ) : (
          <p className="loading-text">Profile information is not available. Please log in.</p>
        )}
      </Card>
    </div>
  );
}

/**
 * Produce a user-friendly display string for a field value in view mode.
 */
function formatDisplayValue(key, value, options) {
  if (!value) return 'Not specified';

  if (key === 'dateOfBirth') {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  if (options) {
    const match = options.find((o) => o.value === value);
    return match ? match.label : value;
  }

  if (key === 'gender') {
    return value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ');
  }

  return value;
}
