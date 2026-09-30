import api from './api';

/**
 * Fetch the prescription for a consultation.
 * Returns null if no prescription exists.
 * @param {string} consultationId - Consultation MongoDB _id.
 * @returns {Promise<{ success: boolean, prescription: object|null }>}
 */
export async function getConsultationPrescription(consultationId) {
  return api(`/prescriptions/consultation/${consultationId}`);
}

/**
 * Create or replace prescription items for a consultation.
 * An empty items array deletes the prescription.
 * @param {string} consultationId - Consultation MongoDB _id.
 * @param {object[]} items - Array of medicine item objects.
 * @returns {Promise<{ success: boolean, prescription: object|null }>}
 */
export async function saveConsultationPrescription(consultationId, items) {
  return api(`/prescriptions/consultation/${consultationId}`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}
