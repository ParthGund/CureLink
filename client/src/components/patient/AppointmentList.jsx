import AppointmentCard from '../common/AppointmentCard';

/**
 * Renders a vertical list of AppointmentCard components.
 *
 * @param {object}   props
 * @param {object[]} props.appointments      - Array of populated appointment documents.
 * @param {function} [props.onCancelRequest] - Forwarded to each AppointmentCard.
 *                                            Called with the full appointment object.
 */
export default function AppointmentList({ appointments, onCancelRequest }) {
  return (
    <div className="appointment-list">
      {appointments.map((appointment) => (
        <AppointmentCard
          key={appointment._id}
          appointment={appointment}
          onCancelRequest={onCancelRequest}
        />
      ))}
    </div>
  );
}
