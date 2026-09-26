import api from './api';

/**
 * Fetch all doctors (public listing, any authenticated role).
 * @returns {Promise<object[]>} Array of doctor objects.
 */
export async function getDoctors() {
  const data = await api('/doctors');
  return data.doctors;
}

/**
 * Fetch a single doctor's public profile by id.
 * @param {string} id - Doctor MongoDB _id.
 * @returns {Promise<object>} Doctor object.
 */
export async function getDoctorById(id) {
  const data = await api(`/doctors/${id}`);
  return data.doctor;
}

/**
 * Fetch a doctor's availability over a date range.
 * Only dates with at least one open slot are returned.
 *
 * @param {string} id - Doctor MongoDB _id.
 * @param {object} [options]
 * @param {string} [options.from] - Start date in YYYY-MM-DD format.
 * @param {string} [options.to]   - End date in YYYY-MM-DD format.
 * @returns {Promise<Array<{ date: string, slots: Array<{ id: string, startTime: string, endTime: string, label: string }> }>>}
 */
export async function getDoctorAvailability(id, { from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await api(`/doctors/${id}/availability${query}`);
  return data.availability;
}

// ── Doctor own-profile & schedule endpoints (require role: doctor) ──

/**
 * Fetch the logged-in doctor's own profile.
 * @returns {Promise<object>} Doctor profile document.
 */
export async function getMyProfile() {
  const data = await api('/doctors/me');
  return data.doctor;
}

/**
 * Update the logged-in doctor's editable profile fields.
 * @param {{ experience?: number, qualifications?: string, bio?: string, languages?: string[] }} payload
 * @returns {Promise<object>} Updated doctor profile document.
 */
export async function updateMyProfile(payload) {
  const data = await api('/doctors/me', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return data.doctor;
}

/**
 * Fetch the logged-in doctor's own time slots.
 * @param {object} [options]
 * @param {string} [options.from] - Start date in YYYY-MM-DD format.
 * @param {string} [options.to]   - End date in YYYY-MM-DD format.
 * @returns {Promise<Array<{ id: string, date: string, startTime: string, endTime: string, label: string, isBooked: boolean }>>}
 */
export async function getMySlots({ from, to } = {}) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await api(`/doctors/me/slots${query}`);
  return data.slots;
}

/**
 * Create time slots from a time window.
 * @param {{ date: string, startTime: string, endTime: string, slotDurationMinutes: number }} payload
 * @returns {Promise<object[]>} Array of created slot objects.
 */
export async function createMySlots(payload) {
  const data = await api('/doctors/me/slots', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.slots;
}

/**
 * Update a time slot (edit times or status).
 * @param {string} id 
 * @param {object} changes 
 */
export async function updateMySlot(id, changes) {
  const data = await api(`/doctors/me/slots/${id}`, { method: 'PUT', body: JSON.stringify(changes) });
  return data;
}

/**
 * Delete a single slot.
 * @param {string} id - Slot _id.
 * @returns {Promise<void>}
 */
export async function deleteMySlot(id) {
  await api(`/doctors/me/slots/${id}`, { method: 'DELETE' });
}

/**
 * Generate time slots for the next 30 days from the doctor's working-hours pattern.
 * Safe to call repeatedly; existing slots are skipped.
 * @returns {Promise<{ created: number, skipped: number, message: string }>}
 */
export async function generateSlotsFromWorkingHours() {
  const data = await api('/doctors/me/slots/from-working-hours', { method: 'POST' });
  return { created: data.created, skipped: data.skipped, message: data.message };
}

/**
 * Get the doctor's working schedule settings.
 * @returns {Promise<object>} Schedule object.
 */
export async function getMySchedule() {
  const data = await api('/doctors/me/schedule');
  return data.schedule;
}

/**
 * Update the doctor's working schedule settings.
 * @param {object} payload 
 * @returns {Promise<{schedule: object, message: string}>}
 */
export async function updateMySchedule(payload) {
  const data = await api('/doctors/me/schedule', { method: 'PUT', body: JSON.stringify(payload) });
  return { schedule: data.schedule, message: data.message };
}

/**
 * Cancel a whole day of slots.
 * @param {string} date "YYYY-MM-DD"
 * @returns {Promise<{cancelled: number, keptBooked: number, message: string}>}
 */
export async function cancelMyDay(date) {
  const data = await api('/doctors/me/slots/cancel-day', { method: 'POST', body: JSON.stringify({ date }) });
  return { cancelled: data.cancelled, keptBooked: data.keptBooked, message: data.message };
}

/**
 * Fetch patients associated with the logged-in doctor.
 * @returns {Promise<object[]>} Array of patient objects.
 */
export async function getMyPatients() {
  const data = await api('/doctors/me/patients');
  return data.patients;
}

/**
 * Fetch a single patient by ID for the logged-in doctor.
 * @param {string} patientId - Patient MongoDB _id.
 * @returns {Promise<object>} Patient object with appointments array.
 */
export async function getMyPatientById(patientId) {
  const data = await api(`/doctors/me/patients/${patientId}`);
  return data.patient;
}
