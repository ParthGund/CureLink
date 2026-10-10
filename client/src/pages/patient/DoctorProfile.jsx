import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronLeft, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import DoctorAvailability from '../../components/patient/DoctorAvailability';
import { getDoctorById, getDoctorAvailability } from '../../services/doctorService';
import { bookAppointment } from '../../services/appointmentService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDisplayDate } from '../../utils/dateUtils';

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const availRef = useRef(null);

  // Doctor data
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState('');

  // Slot selection state (lifted here so the modal can read them)
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Booking confirmation modal
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user } = useAuth();
  const hasPhone = !!user?.patient?.phone;

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

  // Called by DoctorAvailability when patient clicks a slot chip
  function handleSlotSelect(date, slotLabel) {
    setSelectedDate(date);
    setSelectedSlot(slotLabel);
    if (slotLabel) {
      setReason('');
      setReasonError('');
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setReason('');
    setReasonError('');
    setPhone('');
    setPhoneError('');
  }

  async function handleConfirmBooking() {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 5) {
      setReasonError('Please describe your symptoms or reason (at least 5 characters).');
      return;
    }
    
    let trimmedPhone = '';
    if (!hasPhone) {
      trimmedPhone = phone.trim();
      if (!trimmedPhone) {
        setPhoneError('Phone number is required.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await bookAppointment({
        doctorId,
        date: selectedDate,
        timeSlot: selectedSlot,
        reason: trimmedReason,
        patient: !hasPhone ? { phone: trimmedPhone } : undefined,
      });
      toast.success('Appointment booked successfully!');
      navigate('/patient/appointments');
    } catch (err) {
      toast.error(err.message || 'Slot is no longer available. Please choose another.');
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  }

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
              {typeof doctor.consultationFee === 'number' && (
                <div className="doctor-profile__row">
                  <dt>Consultation fee</dt>
                  <dd>₹{doctor.consultationFee}</dd>
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
              <button
                type="button"
                className="button"
                onClick={() => availRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                Book an Appointment
              </button>
            </div>
          </Card>

          {/* Availability card */}
          <div ref={availRef}>
          <Card className="doctor-profile__avail-card">
            <div className="doctor-profile__avail-header">
              <h2>Available times</h2>
              <p className="doctor-profile__avail-hint">
                Select a date and time below to book your appointment.
              </p>
            </div>
            {availability.length > 0 ? (
              <div className="doctor-profile__avail-body">
                <DoctorAvailability
                  doctorId={doctorId}
                  availability={availability}
                  selectedSlot={selectedSlot}
                  onSlotSelect={handleSlotSelect}
                />
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No available times"
                description="This doctor hasn't opened any appointment times yet. Please check back soon."
              />
            )}
          </Card>
          </div>
        </>
      )}

      {/* ── Booking confirmation modal ──────────────────────────── */}
      {showModal && doctor && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-modal-title"
          onClick={handleCloseModal}
        >
          <div
            className="modal-panel booking-confirm-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header booking-confirm-panel__header">
              <div>
                <h2 id="booking-modal-title" className="modal-title">
                  Confirm appointment
                </h2>
                <p className="modal-subtitle">
                  Please review and confirm your booking details.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseModal}
                aria-label="Close booking panel"
              >
                <X size={20} />
              </button>
            </div>

            {/* Summary */}
            <div className="booking-confirm-panel__body">
              <dl className="booking-confirm-panel__summary">
                <div className="booking-confirm-panel__row">
                  <dt>Doctor</dt>
                  <dd>
                    Dr. {doctor.name}
                    <span className="booking-confirm-panel__spec">
                      {doctor.specialization}
                    </span>
                  </dd>
                </div>
                <div className="booking-confirm-panel__row">
                  <dt>Date</dt>
                  <dd>{selectedDate ? formatDisplayDate(selectedDate) : '—'}</dd>
                </div>
                <div className="booking-confirm-panel__row">
                  <dt>Time</dt>
                  <dd>{selectedSlot}</dd>
                </div>
                {typeof doctor.consultationFee === 'number' && (
                  <div className="booking-confirm-panel__row">
                    <dt>Fee</dt>
                    <dd>₹{doctor.consultationFee}</dd>
                  </div>
                )}
              </dl>

              {/* Reason */}
              <div className="booking-confirm-panel__field">
                <label
                  className="field-label"
                  htmlFor="booking-reason"
                >
                  Reason / Symptoms
                  <span className="field-required" aria-hidden="true"> *</span>
                </label>
                <textarea
                  id="booking-reason"
                  className={`booking-confirm-panel__textarea${reasonError ? ' booking-confirm-panel__textarea--error' : ''}`}
                  placeholder="Describe your symptoms or reason for visit…"
                  value={reason}
                  rows={3}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (reasonError) setReasonError('');
                  }}
                />
                {reasonError && (
                  <p className="field-error" role="alert">{reasonError}</p>
                )}
              </div>

              {/* Phone (if missing) */}
              {!hasPhone && (
                <div className="booking-confirm-panel__field" style={{ marginTop: '16px' }}>
                  <label className="field-label" htmlFor="booking-phone">
                    Phone Number
                    <span className="field-required" aria-hidden="true"> *</span>
                  </label>
                  <input
                    id="booking-phone"
                    type="tel"
                    className={`booking-confirm-panel__input${phoneError ? ' booking-confirm-panel__input--error' : ''}`}
                    placeholder="Enter your phone number..."
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                  />
                  {phoneError && (
                    <p className="field-error" role="alert">{phoneError}</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={handleConfirmBooking}
                  disabled={submitting}
                >
                  {submitting ? 'Booking…' : 'Confirm Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
