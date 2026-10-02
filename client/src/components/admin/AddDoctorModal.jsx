import { useState } from 'react';
import { X } from 'lucide-react';
import { createDoctor } from '../../services/adminService';

const SPECIALIZATIONS = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Gynecology',
  'Ophthalmology',
  'ENT',
  'Psychiatry',
];

const DAY_LABELS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  specialization: 'General Medicine',
  experience: 1,
  availableDays: [1, 2, 3, 4, 5],
  startTime: '09:00',
  endTime: '17:00',
};

/**
 * Modal form for creating a new doctor account and profile.
 *
 * @param {{ open: boolean, onClose: () => void, onCreated: () => void }} props
 */
export default function AddDoctorModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleDay(day) {
    setForm((prev) => {
      const days = prev.availableDays.includes(day)
        ? prev.availableDays.filter((d) => d !== day)
        : [...prev.availableDays, day];
      return { ...prev, availableDays: days };
    });
  }

  function validate() {
    if (!form.name.trim()) return 'Full name is required.';
    if (!form.email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 6) return 'Password must be at least 6 characters.';
    if (!form.specialization) return 'Specialization is required.';
    if (form.availableDays.length === 0) return 'Select at least one working day.';
    return '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await createDoctor({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        specialization: form.specialization,
        experience: Number(form.experience) || 1,
        availableDays: form.availableDays,
        workingHours: { start: form.startTime, end: form.endTime },
      });

      // Reset and close
      setForm({ ...INITIAL_FORM });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create doctor account.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Add new doctor">
      <div className="modal-panel">
        <header className="modal-header">
          <h2>Add New Doctor</h2>
          <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {error && <p className="modal-error">{error}</p>}

          {/* ── Row 1: Name + Email ──────────────────────── */}
          <div className="modal-row">
            <label className="modal-field">
              <span className="modal-label">Full Name <span aria-hidden="true">*</span></span>
              <input
                type="text"
                className="modal-input"
                placeholder="Dr. Jane Smith"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">Email Address <span aria-hidden="true">*</span></span>
              <input
                type="email"
                className="modal-input"
                placeholder="jane.smith@curelink.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </label>
          </div>

          {/* ── Row 2: Password + Specialization ────────── */}
          <div className="modal-row">
            <label className="modal-field">
              <span className="modal-label">Temporary Password <span aria-hidden="true">*</span></span>
              <input
                type="password"
                className="modal-input"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={6}
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">Specialization <span aria-hidden="true">*</span></span>
              <select
                className="modal-input"
                value={form.specialization}
                onChange={(e) => update('specialization', e.target.value)}
              >
                {SPECIALIZATIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
          </div>

          {/* ── Row 3: Experience ────────────────────────── */}
          <label className="modal-field">
            <span className="modal-label">Experience (years)</span>
            <input
              type="number"
              className="modal-input modal-input--small"
              min={0}
              max={60}
              value={form.experience}
              onChange={(e) => update('experience', e.target.value)}
            />
          </label>

          {/* ── Available Days ───────────────────────────── */}
          <fieldset className="modal-fieldset">
            <legend className="modal-label">Available Days</legend>
            <div className="modal-days">
              {DAY_LABELS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`modal-day-chip ${form.availableDays.includes(value) ? 'modal-day-chip--active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={form.availableDays.includes(value)}
                    onChange={() => toggleDay(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* ── Working Hours ────────────────────────────── */}
          <div className="modal-row">
            <label className="modal-field">
              <span className="modal-label">Start Time</span>
              <input
                type="time"
                className="modal-input"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
              />
            </label>
            <label className="modal-field">
              <span className="modal-label">End Time</span>
              <input
                type="time"
                className="modal-input"
                value={form.endTime}
                onChange={(e) => update('endTime', e.target.value)}
              />
            </label>
          </div>

          {/* ── Actions ─────────────────────────────────── */}
          <div className="modal-actions">
            <button type="button" className="button button--secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="button" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
