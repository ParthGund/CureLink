import { CalendarDays, ChevronLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

export default function BookAppointment() {
  return <div className="booking-page"><header className="booking-header"><Button to="/patient/appointments" variant="text"><ChevronLeft size={18} /> Cancel</Button><h1>Book Appointment</h1></header><ol className="booking-steps" aria-label="Booking steps"><li className="complete">Patient Data</li><li className="active">Slot Selection</li><li>Review</li></ol><section className="booking-content"><header><h2>Choose a suitable time</h2><p>Available appointment times will appear after a clinician and date are selected.</p></header><div className="booking-grid"><Card className="booking-card"><h2>Select date</h2><label className="field-label" htmlFor="appointment-date">Preferred date</label><input id="appointment-date" type="date" /></Card><Card className="booking-card booking-card--empty"><CalendarDays size={34} /><h2>No time slots available</h2><p>Select a date to see available appointment times.</p></Card></div></section><footer className="booking-footer"><Button to="/patient/appointments" variant="secondary">Back</Button><button className="button" type="button" disabled>Continue to Review</button></footer></div>;
}
