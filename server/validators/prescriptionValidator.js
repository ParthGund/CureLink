/**
 * Server-side validation for prescription requests.
 */

const mongoose = require('mongoose');

/** Fields allowed on each prescription item. */
const ALLOWED_ITEM_FIELDS = [
  'medicine',
  'dosage',
  'frequency',
  'duration',
  'durationDays',
  'instructions',
];

/**
 * Validate a consultation ObjectId route parameter.
 *
 * @param {string} id - consultationId from req.params.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateConsultationIdParam(id) {
  const errors = [];

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    errors.push('Invalid consultation ID.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate prescription upsert input.
 *
 * Expects `{ items: [...] }`. Each item must contain only whitelisted
 * fields; unknown fields are rejected with a clear message.
 *
 * @param {object} data - Request body.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validatePrescriptionUpsert(data) {
  const errors = [];

  if (!data || !Array.isArray(data.items)) {
    errors.push('Items must be an array.');
    return { valid: false, errors };
  }

  if (data.items.length > 20) {
    errors.push('A prescription may have at most 20 items.');
    return { valid: false, errors };
  }

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const pos = `Item ${i + 1}`;

    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push(`${pos}: must be an object.`);
      continue;
    }

    // Reject unknown fields
    const itemKeys = Object.keys(item);
    for (const key of itemKeys) {
      if (!ALLOWED_ITEM_FIELDS.includes(key)) {
        errors.push(`${pos}: unknown field "${key}".`);
      }
    }

    // medicine — required non-empty string
    if (
      item.medicine === undefined ||
      item.medicine === null ||
      typeof item.medicine !== 'string' ||
      item.medicine.trim().length === 0
    ) {
      errors.push(`${pos}: medicine name is required.`);
    } else if (item.medicine.length > 100) {
      errors.push(`${pos}: medicine name must be 100 characters or fewer.`);
    }

    // dosage
    if (item.dosage !== undefined) {
      if (typeof item.dosage !== 'string') {
        errors.push(`${pos}: dosage must be a string.`);
      } else if (item.dosage.length > 100) {
        errors.push(`${pos}: dosage must be 100 characters or fewer.`);
      }
    }

    // frequency
    if (item.frequency !== undefined) {
      if (typeof item.frequency !== 'string') {
        errors.push(`${pos}: frequency must be a string.`);
      } else if (item.frequency.length > 100) {
        errors.push(`${pos}: frequency must be 100 characters or fewer.`);
      }
    }

    // duration
    if (item.duration !== undefined) {
      if (typeof item.duration !== 'string') {
        errors.push(`${pos}: duration must be a string.`);
      } else if (item.duration.length > 100) {
        errors.push(`${pos}: duration must be 100 characters or fewer.`);
      }
    }

    // durationDays — integer 1–365 when present
    if (item.durationDays !== undefined) {
      if (
        typeof item.durationDays !== 'number' ||
        !Number.isInteger(item.durationDays)
      ) {
        errors.push(`${pos}: durationDays must be an integer.`);
      } else if (item.durationDays < 1 || item.durationDays > 365) {
        errors.push(`${pos}: durationDays must be between 1 and 365.`);
      }
    }

    // instructions
    if (item.instructions !== undefined) {
      if (typeof item.instructions !== 'string') {
        errors.push(`${pos}: instructions must be a string.`);
      } else if (item.instructions.length > 300) {
        errors.push(`${pos}: instructions must be 300 characters or fewer.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateConsultationIdParam,
  validatePrescriptionUpsert,
};
