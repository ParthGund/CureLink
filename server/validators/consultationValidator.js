/**
 * Server-side validation for consultation requests.
 */

const mongoose = require('mongoose');

/**
 * Validate consultation creation input.
 *
 * @param {object} data - { appointmentId }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConsultationCreation(data) {
  const errors = [];

  if (!data.appointmentId || typeof data.appointmentId !== 'string') {
    errors.push('Appointment ID is required.');
  } else if (!mongoose.Types.ObjectId.isValid(data.appointmentId)) {
    errors.push('Invalid appointment ID.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a consultation ObjectId parameter.
 *
 * @param {string} id - Consultation _id.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConsultationId(id) {
  const errors = [];

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    errors.push('Invalid consultation ID.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate consultation update input.
 *
 * Allows chiefComplaint, diagnosis, and clinicalNotes.
 * All fields are optional but must meet type and length constraints.
 *
 * @param {object} data - Request body fields.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConsultationUpdate(data) {
  const errors = [];

  if (data.chiefComplaint !== undefined) {
    if (typeof data.chiefComplaint !== 'string') {
      errors.push('Chief complaint must be a string.');
    } else if (data.chiefComplaint.length > 500) {
      errors.push('Chief complaint must be 500 characters or fewer.');
    }
  }

  if (data.diagnosis !== undefined) {
    if (typeof data.diagnosis !== 'string') {
      errors.push('Diagnosis must be a string.');
    } else if (data.diagnosis.length > 1000) {
      errors.push('Diagnosis must be 1000 characters or fewer.');
    }
  }

  if (data.clinicalNotes !== undefined) {
    if (typeof data.clinicalNotes !== 'string') {
      errors.push('Clinical notes must be a string.');
    } else if (data.clinicalNotes.length > 2000) {
      errors.push('Clinical notes must be 2000 characters or fewer.');
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateConsultationCreation,
  validateConsultationId,
  validateConsultationUpdate,
};
