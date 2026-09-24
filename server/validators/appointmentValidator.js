/**
 * Server-side validation for appointment requests.
 */

const mongoose = require('mongoose');

/**
 * Validate appointment creation input.
 *
 * @param {object} data - { doctorId, date, timeSlot, reason }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAppointmentCreation(data) {
  const errors = [];

  if (!data.doctorId || typeof data.doctorId !== 'string') {
    errors.push('Doctor is required.');
  } else if (!mongoose.Types.ObjectId.isValid(data.doctorId)) {
    errors.push('Invalid doctor ID.');
  }

  if (!data.date || typeof data.date !== 'string') {
    errors.push('Date is required.');
  } else {
    const parsed = new Date(data.date);
    if (isNaN(parsed.getTime())) {
      errors.push('Invalid date format.');
    }
  }

  if (!data.timeSlot || typeof data.timeSlot !== 'string' || data.timeSlot.trim().length === 0) {
    errors.push('Time slot is required.');
  }

  if (data.reason !== undefined && typeof data.reason !== 'string') {
    errors.push('Reason must be a string.');
  } else if (data.reason && data.reason.length > 500) {
    errors.push('Reason must be 500 characters or fewer.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate appointment cancellation — just checks that the ID is valid.
 *
 * @param {string} id - Appointment ID.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateAppointmentId(id) {
  const errors = [];

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    errors.push('Invalid appointment ID.');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateAppointmentCreation,
  validateAppointmentId,
};
