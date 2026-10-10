import api from './api';

/**
 * Start a new consultation for the given appointment.
 * @param {string} appointmentId - Appointment MongoDB _id.
 * @returns {Promise<{ success: boolean, consultation: object }>}
 */
export async function startConsultation(appointmentId) {
  return api('/consultations', {
    method: 'POST',
    body: JSON.stringify({ appointmentId }),
  });
}

/**
 * Fetch all consultations for the authenticated doctor.
 * @returns {Promise<{ success: boolean, consultations: object[] }>}
 */
export async function getDoctorConsultations() {
  return api('/consultations/doctor/me');
}

/**
 * Fetch consultations for the authenticated patient.
 * @returns {Promise<{ success: boolean, consultations: object[] }>}
 */
export async function getMyConsultations() {
  return api('/consultations/me');
}

/**
 * Fetch a single consultation by ID.
 * @param {string} id - Consultation MongoDB _id.
 * @returns {Promise<{ success: boolean, consultation: object }>}
 */
export async function getConsultationById(id) {
  return api(`/consultations/${id}`);
}

/**
 * Save draft consultation fields (chiefComplaint, diagnosis, clinicalNotes).
 * @param {string} id - Consultation MongoDB _id.
 * @param {object} payload - Fields to update.
 * @returns {Promise<{ success: boolean, consultation: object }>}
 */
export async function saveConsultation(id, payload) {
  return api(`/consultations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * Mark a consultation as completed.
 * @param {string} id - Consultation MongoDB _id.
 * @returns {Promise<{ success: boolean, consultation: object }>}
 */
export async function completeConsultation(id) {
  return api(`/consultations/${id}/complete`, { method: 'PUT' });
}
