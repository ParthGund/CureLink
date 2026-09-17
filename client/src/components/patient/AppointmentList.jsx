import AppointmentCard from '../common/AppointmentCard';

/**
 * Renders a vertical list of AppointmentCard components.
 *
 * @param {object}   props
 * @param {object[]} props.appointments - Array of populated appointment documents.
 * @param {function} [props.onCancel]   - Forwarded to each AppointmentCard for cancellation.
 */
export default function AppointmentList({ appointments, onCancel }) {
  return (
    <div className="appointment-list">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment._id}
          appointment={appointment}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
