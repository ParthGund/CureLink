import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Mail, Phone, CalendarDays, History,
  ClipboardList, Droplets, MapPin, AlertCircle, Heart, Syringe, Pill,
} from 'lucide-react';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import { getMyPatientById } from '../../services/doctorService';
import { useToast } from '../../context/ToastContext';

/** Capitalise just the first letter of a string. */
function cap(s) {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Calculate age in completed years from an ISO date string.
 * Returns null if the date is invalid.
 */
function calcAge(dobStr) {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

/**
 * Split a comma- or semicolon-separated string of items into an array of
 * trimmed, non-empty strings. Returns an empty array when nothing is present.
 */
function splitItems(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
}

/* ── Reusable sub-components ───────────────────────────────────── */

/** One identity row: label + value. Returns null when value is absent. */
function InfoRow({ icon: Icon, label, value, className = '' }) {
  if (value == null || value === '') return null;
  return (
    <div className="dpp-identity-row">
      <dt className="dpp-identity-row__label">
        {Icon && <Icon size={14} aria-hidden="true" className="dpp-identity-row__icon" />}
        {label}
      </dt>
      <dd className={`dpp-identity-row__value ${className}`}>{value}</dd>
    </div>
  );
}

/**
 * Renders a comma-delimited string as pill tags, or a muted "None reported"
 * fallback when the list is empty.
 */
function PillList({ items, colorClass = 'dpp-pill' }) {
  if (!items || items.length === 0) {
    return <span className="dpp-none">None reported</span>;
  }
  return (
    <div className="dpp-pill-wrap">
      {items.map((item, i) => (
        <span key={i} className={`dpp-pill ${colorClass}`}>{item}</span>
      ))}
    </div>
  );
}

/** A labelled medical section with pill-list content. */
function MedSection({ icon: Icon, label, rawValue, colorClass }) {
  const items = splitItems(rawValue);
  return (
    <div className="dpp-med-section">
      <h3 className="dpp-med-section__title">
        <Icon size={15} aria-hidden="true" />
        {label}
      </h3>
      <PillList items={items} colorClass={colorClass} />
    </div>
  );
}

/** Status badge, consistent with dr-apt-status design system. */
function StatusBadge({ status }) {
  return (
    <span className={`dr-apt-status dr-apt-status--${status}`}>
      {status}
    </span>
  );
}

/* ── Skeleton Loading ──────────────────────────────────────────── */
function ProfileSkeleton({ backLink }) {
  return (
    <div>
      {backLink}
      <div className="dpp-grid">
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div className="card-heading">
              <div className="skeleton-line" style={{ width: '140px', height: '18px' }} />
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[80, 60, 50, 70, 45].map((w, i) => (
                <div key={i} className="skeleton-line" style={{ width: `${w}%`, height: '14px' }} />
              ))}
            </div>
          </Card>
        </div>
        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card>
            <div className="card-heading">
              <div className="skeleton-line" style={{ width: '160px', height: '18px' }} />
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[90, 65, 55, 75].map((w, i) => (
                <div key={i} className="skeleton-line" style={{ width: `${w}%`, height: '14px' }} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────────── */

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

  const backLink = (
    <Link
      to="/doctor/patients"
      className="button button--secondary"
      style={{ display: 'inline-flex', gap: '6px', marginBottom: '24px' }}
    >
      <ArrowLeft size={16} aria-hidden="true" /> Back to Patients
    </Link>
  );

  if (loading) return <ProfileSkeleton backLink={backLink} />;

  if (!patient) {
    return (
      <div>
        {backLink}
        <EmptyState
          icon={User}
          title="Patient not found"
          description="The requested patient profile could not be loaded."
        />
      </div>
    );
  }

  const {
    fullName, email, phone, gender, dateOfBirth,
    bloodGroup, address, emergencyContact, appointments = [],
    allergies, chronicConditions, surgeries, currentMedications,
  } = patient;

  const age = calcAge(dateOfBirth);
  const dobFormatted = dateOfBirth
    ? new Date(dateOfBirth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const dobLabel = dobFormatted
    ? (age !== null ? `${dobFormatted} (${age} yrs)` : dobFormatted)
    : null;

  return (
    <div>
      {backLink}

      <header className="page-heading">
        <div>
          <h1>{fullName}</h1>
          <p>Patient Profile &amp; Appointment History</p>
        </div>
      </header>

      {/* ── 2-Column Dashboard Grid ─────────────────────────────── */}
      <div className="dpp-grid">

        {/* ── LEFT COLUMN ─────────────────────────────────────── */}
        <div className="dpp-col">

          {/* Identity Card */}
          <Card>
            <div className="card-heading">
              <h2 className="dpp-card-title">
                <User size={17} aria-hidden="true" className="dpp-card-title__icon" />
                Patient Identity
              </h2>
            </div>
            <dl className="dpp-identity-list">
              <InfoRow icon={Mail}        label="Email"     value={email || '—'} />
              <InfoRow icon={Phone}       label="Phone"     value={phone || '—'} />
              <InfoRow icon={User}        label="Gender"    value={cap(gender) || '—'} />
              <InfoRow icon={CalendarDays} label="Date of Birth" value={dobLabel || '—'} />
              <InfoRow icon={Droplets}    label="Blood Group"
                value={bloodGroup
                  ? <span className="dpp-blood-badge">{bloodGroup}</span>
                  : '—'}
              />
              <InfoRow icon={MapPin}      label="Address"   value={address || '—'} />
              <InfoRow
                icon={AlertCircle}
                label="Emergency Contact"
                value={emergencyContact || '—'}
              />
            </dl>
          </Card>

        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────── */}
        <div className="dpp-col">

          {/* Medical Details Card */}
          <Card>
            <div className="card-heading">
              <h2 className="dpp-card-title">
                <ClipboardList size={17} aria-hidden="true" className="dpp-card-title__icon" />
                Medical Details
              </h2>
            </div>
            <div className="dpp-med-body">
              <MedSection
                icon={AlertCircle}
                label="Allergies"
                rawValue={allergies}
                colorClass="dpp-pill--allergy"
              />
              <MedSection
                icon={Heart}
                label="Chronic Conditions"
                rawValue={chronicConditions}
                colorClass="dpp-pill--condition"
              />
              <MedSection
                icon={Syringe}
                label="Past Surgeries"
                rawValue={surgeries}
                colorClass="dpp-pill--surgery"
              />
              <MedSection
                icon={Pill}
                label="Current Medications"
                rawValue={currentMedications}
                colorClass="dpp-pill--medication"
              />
            </div>
          </Card>

          {/* Appointment History Card */}
          <Card>
            <div className="card-heading">
              <h2 className="dpp-card-title">
                <History size={17} aria-hidden="true" className="dpp-card-title__icon" />
                Appointment History
                {appointments.length > 0 && (
                  <span className="dpp-apt-count">{appointments.length}</span>
                )}
              </h2>
            </div>

            {appointments.length > 0 ? (
              <div className="dr-apt-table-wrap">
                <table className="dr-apt-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Reason</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt._id}>
                        <td>
                          {new Date(apt.date).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td>{apt.timeSlot || '—'}</td>
                        <td className="dpp-apt-reason">{apt.reason || <span className="dpp-muted">—</span>}</td>
                        <td><StatusBadge status={apt.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={History}
                title="No history found"
                description="This patient has no appointment history with you."
              />
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
