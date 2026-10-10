import api from './api';

/**
 * Fetch aggregated platform statistics.
 * @returns {Promise<{ totalDoctors, totalPatients, totalAppointments, pendingAppointments }>}
 */
export async function getStats() {
  const data = await api('/admin/stats');
  return data.stats;
}

/**
 * Fetch all doctors (with linked user info when available).
 * @returns {Promise<object[]>}
 */
export async function getDoctors() {
  const data = await api('/admin/doctors');
  return data.doctors;
}

/**
 * Create a new doctor account and profile.
 * @param {object} doctorData - { name, email, password, specialization, ... }
 * @returns {Promise<object>} Created doctor document.
 */
export async function createDoctor(doctorData) {
  return api('/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(doctorData),
  });
}

/**
 * Remove a doctor profile and linked user record.
 * @param {string} id - Doctor MongoDB _id.
 */
export async function deleteDoctor(id) {
  return api(`/admin/doctors/${id}`, { method: 'DELETE' });
}

/**
 * Update an existing doctor's profile fields (admin only).
 * @param {string} id - Doctor MongoDB _id.
 * @param {object} doctorData - { name, specialization, experience, availableDays, workingHours }
 * @returns {Promise<object>} Updated doctor document.
 */
export async function updateDoctor(id, doctorData) {
  return api(`/admin/doctors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(doctorData),
  });
}

/**
 * Fetch all patient users.
 * @returns {Promise<object[]>}
 */
export async function getPatients() {
  const data = await api('/admin/patients');
  return data.patients;
}



/**
 * Fetch all appointments with patient and doctor details.
 * @returns {Promise<object[]>}
 */
export async function getAppointments() {
  const data = await api('/admin/appointments');
  return data.appointments;
}

/**
 * Update an appointment's lifecycle status (admin only).
 * @param {string} id - Appointment MongoDB _id.
 * @param {'scheduled'|'confirmed'|'completed'|'cancelled'} status - New status.
 */
export async function updateAppointmentStatus(id, status) {
  return api(`/admin/appointments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}
