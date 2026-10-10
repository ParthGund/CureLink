import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronLeft } from "lucide-react";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import { getAvailableSlots, bookAppointment } from "../../services/appointmentService";
import { getDoctors } from "../../services/doctorService";
import { useToast } from "../../context/ToastContext";

export default function BookAppointment() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0); // 0 = Patient Data, 1 = Slot Selection, 2 = Review

  const [patient, setPatient] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    reasonForVisit: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selectedDoctor = doctors.find((d) => d._id === doctorId);
  const doctorName = selectedDoctor?.name || "";

  useEffect(() => {
    getDoctors()
      .then((docs) => {
        setDoctors(docs);
        if (docs.length > 0) {
          setDoctorId(docs[0]._id);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!doctorId || !date) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot("");
    getAvailableSlots(doctorId, date)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [doctorId, date]);

  const stepClass = (i) => (i === step ? "active" : i < step ? "complete" : "");

  const canContinue =
    step === 0
      ? patient.fullName && patient.email && patient.phone
      : step === 1
      ? Boolean(selectedSlot)
      : true;

  const handleNext = () => setStep((s) => Math.min(s + 1, 2));
  const handleBack = () => (step === 0 ? navigate("/patient/appointments") : setStep((s) => s - 1));

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      await bookAppointment({
        patient,
        doctorId,
        date,
        timeSlot: selectedSlot,
        reason: patient.reasonForVisit,
      });
      toast.success("Appointment booked successfully!");
      navigate("/patient/appointments");
    } catch (err) {
      const msg = err.message || "Failed to book appointment. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Button to="/patient/appointments" variant="text">
          <ChevronLeft size={18} /> Cancel
        </Button>
        <h1>Book Appointment</h1>
      </header>

      <ol className="booking-steps" aria-label="Booking steps">
        <li className={stepClass(0)}>Patient Data</li>
        <li className={stepClass(1)}>Slot Selection</li>
        <li className={stepClass(2)}>Review</li>
      </ol>

      {step === 0 && (
        <section className="booking-content">
          <header>
            <h2>Patient details</h2>
            <p>Tell us who this appointment is for.</p>
          </header>
          <Card className="booking-card">
            <label className="field-label" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              value={patient.fullName}
              onChange={(e) => setPatient({ ...patient, fullName: e.target.value })}
            />

            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={patient.email}
              onChange={(e) => setPatient({ ...patient, email: e.target.value })}
            />

            <label className="field-label" htmlFor="phone">
              Phone
            </label>
            <input
              id="phone"
              value={patient.phone}
              onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
            />

            <label className="field-label" htmlFor="dob">
              Date of birth
            </label>
            <input
              id="dob"
              type="date"
              value={patient.dateOfBirth}
              onChange={(e) => setPatient({ ...patient, dateOfBirth: e.target.value })}
            />

            <label className="field-label" htmlFor="gender">
              Gender
            </label>
            <select
              id="gender"
              value={patient.gender}
              onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <label className="field-label" htmlFor="reason">
              Reason for visit
            </label>
            <textarea
              id="reason"
              value={patient.reasonForVisit}
              onChange={(e) => setPatient({ ...patient, reasonForVisit: e.target.value })}
            />
          </Card>
        </section>
      )}

      {step === 1 && (
        <section className="booking-content">
          <header>
            <h2>Choose a suitable time</h2>
            <p>Select a clinician and date to see available appointment times.</p>
          </header>
          <div className="booking-grid">
            <Card className="booking-card">
              <label className="field-label" htmlFor="select-doctor">
                Clinician
              </label>
              <select
                id="select-doctor"
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value);
                  setSelectedSlot("");
                }}
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} — {d.specialization}
                  </option>
                ))}
              </select>

              <label className="field-label" htmlFor="appointment-date">
                Preferred date
              </label>
              <input
                id="appointment-date"
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
              />
            </Card>

            {loadingSlots ? (
              <Card className="booking-card booking-card--empty">
                <CalendarDays size={34} />
                <h2>Loading...</h2>
                <p>Fetching available appointment times.</p>
              </Card>
            ) : !date ? (
              <Card className="booking-card booking-card--empty">
                <CalendarDays size={34} />
                <h2>No time slots available</h2>
                <p>Select a date to see available appointment times.</p>
              </Card>
            ) : slots.length === 0 ? (
              <Card className="booking-card booking-card--empty">
                <CalendarDays size={34} />
                <h2>No time slots available</h2>
                <p>{doctorName} has no free slots on this date. Try another date.</p>
              </Card>
            ) : (
              <Card className="booking-card">
                <h2>Available times</h2>
                <div className="slot-buttons">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={selectedSlot === s ? "slot slot--selected" : "slot"}
                      onClick={() => setSelectedSlot(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="booking-content">
          <header>
            <h2>Review your appointment</h2>
          </header>
          <Card className="booking-card">
            <p>
              <strong>Name:</strong> {patient.fullName}
            </p>
            <p>
              <strong>Email:</strong> {patient.email}
            </p>
            <p>
              <strong>Phone:</strong> {patient.phone}
            </p>
            <p>
              <strong>Date of birth:</strong> {patient.dateOfBirth}
            </p>
            <p>
              <strong>Gender:</strong> {patient.gender}
            </p>
            <p>
              <strong>Reason:</strong> {patient.reasonForVisit}
            </p>
            <p>
              <strong>Clinician:</strong> {doctorName}
            </p>
            <p>
              <strong>Date:</strong> {date}
            </p>
            <p>
              <strong>Time:</strong> {selectedSlot}
            </p>
            {error && <p className="error-text">{error}</p>}
          </Card>
        </section>
      )}

      <footer className="booking-footer">
        <Button variant="secondary" onClick={handleBack}>
          Back
        </Button>
        {step < 2 ? (
          <button className="button" type="button" disabled={!canContinue} onClick={handleNext}>
            {step === 0 ? "Continue to Slot Selection" : "Continue to Review"}
          </button>
        ) : (
          <button className="button" type="button" disabled={submitting} onClick={handleConfirm}>
            {submitting ? "Booking..." : "Confirm Appointment"}
          </button>
        )}
      </footer>
    </div>
  );
}