import api from './api';

/**
 * Fetch all registered doctors.
 * @returns {Promise<object[]>} Array of doctor documents.
 */
export async function getDoctors() {
  const data = await api('/doctors');
  return data.doctors;
}

/**
 * Fetch available time slots for a doctor on a given date.
 * @param {string} doctorId - Doctor MongoDB _id.
 * @param {string} date - Date string in YYYY-MM-DD format.
 * @returns {Promise<string[]>} Array of available time slot strings.
 */
export async function getAvailableSlots(doctorId, date) {
  const data = await api(`/doctors/${doctorId}/slots?date=${date}`);
  return data.slots;
}

/**
 * Book a new appointment.
 * @param {object} payload - { patient, doctorId, date, timeSlot, reason }
 * @returns {Promise<object>} The created appointment (populated).
 */
export async function bookAppointment(payload) {
  return api('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch appointments for a specific patient.
 * @param {string} patientId - Patient MongoDB _id.
 * @returns {Promise<{ upcoming: object[], past: object[] }>}
 */
export async function getPatientAppointments(patientId) {
  return api(`/appointments/patient/${patientId}`);
}

/**
 * Cancel an existing appointment.
 * @param {string} id - Appointment MongoDB _id.
 * @returns {Promise<object>} The updated appointment.
 */
export async function cancelAppointment(id) {
  return api(`/appointments/${id}/cancel`, { method: 'PUT' });
}