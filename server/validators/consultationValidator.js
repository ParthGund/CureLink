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
 * Allows chiefComplaint, diagnosis, clinicalNotes, and prescriptions.
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

  if (data.prescriptions !== undefined) {
    if (!Array.isArray(data.prescriptions)) {
      errors.push('Prescriptions must be an array.');
    } else if (data.prescriptions.length > 20) {
      errors.push('A consultation may have at most 20 prescriptions.');
    } else {
      for (let i = 0; i < data.prescriptions.length; i++) {
        const rx = data.prescriptions[i];
        const pos = `Prescription ${i + 1}`;

        if (!rx || typeof rx !== 'object' || Array.isArray(rx)) {
          errors.push(`${pos}: must be an object.`);
          continue;
        }

        if (!rx.medicine || typeof rx.medicine !== 'string' || rx.medicine.trim().length === 0) {
          errors.push(`${pos}: medicine name is required.`);
        } else if (rx.medicine.length > 100) {
          errors.push(`${pos}: medicine name must be 100 characters or fewer.`);
        }

        if (rx.dosage !== undefined) {
          if (typeof rx.dosage !== 'string') {
            errors.push(`${pos}: dosage must be a string.`);
          } else if (rx.dosage.length > 100) {
            errors.push(`${pos}: dosage must be 100 characters or fewer.`);
          }
        }

        if (rx.frequency !== undefined) {
          if (typeof rx.frequency !== 'string') {
            errors.push(`${pos}: frequency must be a string.`);
          } else if (rx.frequency.length > 100) {
            errors.push(`${pos}: frequency must be 100 characters or fewer.`);
          }
        }

        if (rx.duration !== undefined) {
          if (typeof rx.duration !== 'string') {
            errors.push(`${pos}: duration must be a string.`);
          } else if (rx.duration.length > 100) {
            errors.push(`${pos}: duration must be 100 characters or fewer.`);
          }
        }

        if (rx.instructions !== undefined) {
          if (typeof rx.instructions !== 'string') {
            errors.push(`${pos}: instructions must be a string.`);
          } else if (rx.instructions.length > 300) {
            errors.push(`${pos}: instructions must be 300 characters or fewer.`);
          }
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateConsultationCreation,
  validateConsultationId,
  validateConsultationUpdate,
};
