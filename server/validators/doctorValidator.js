/**
 * Server-side validation for doctor management requests.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

/**
 * Validate doctor creation input (admin endpoint).
 *
 * @param {object} data - { name, email, password, specialization, experience, ... }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDoctorCreation(data) {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Doctor name is required.');
  } else if (data.name.trim().length > 100) {
    errors.push('Doctor name must be 100 characters or fewer.');
  }

  if (!data.email || typeof data.email !== 'string') {
    errors.push('Email is required.');
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!data.password || typeof data.password !== 'string') {
    errors.push('Password is required.');
  } else {
    if (data.password.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (data.password.length > MAX_PASSWORD_LENGTH) {
      errors.push(`Password must be ${MAX_PASSWORD_LENGTH} characters or fewer.`);
    }
  }

  if (!data.specialization || typeof data.specialization !== 'string' || data.specialization.trim().length === 0) {
    errors.push('Specialization is required.');
  }

  if (data.experience !== undefined) {
    const exp = Number(data.experience);
    if (isNaN(exp) || exp < 0 || exp > 60) {
      errors.push('Experience must be between 0 and 60 years.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate doctor update input (admin endpoint).
 *
 * Only editable profile fields are validated here.
 * Email and password are not changeable through the edit flow.
 *
 * @param {object} data - { name, specialization, experience, availableDays, workingHours }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDoctorUpdate(data) {
  const errors = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Doctor name cannot be empty.');
    } else if (data.name.trim().length > 100) {
      errors.push('Doctor name must be 100 characters or fewer.');
    }
  }

  if (data.specialization !== undefined) {
    if (typeof data.specialization !== 'string' || data.specialization.trim().length === 0) {
      errors.push('Specialization cannot be empty.');
    }
  }

  if (data.experience !== undefined) {
    const exp = Number(data.experience);
    if (isNaN(exp) || exp < 0 || exp > 60) {
      errors.push('Experience must be between 0 and 60 years.');
    }
  }

  if (data.availableDays !== undefined) {
    if (!Array.isArray(data.availableDays)) {
      errors.push('Available days must be an array.');
    } else if (data.availableDays.length === 0) {
      errors.push('At least one working day is required.');
    } else {
      const allValid = data.availableDays.every(
        (d) => Number.isInteger(d) && d >= 0 && d <= 6
      );
      if (!allValid) {
        errors.push('Each working day must be an integer from 0 (Sun) to 6 (Sat).');
      }
    }
  }

  if (data.workingHours !== undefined) {
    if (typeof data.workingHours !== 'object' || data.workingHours === null) {
      errors.push('Working hours must be an object with start and end times.');
    } else {
      const timeRegex = /^\d{2}:\d{2}$/;
      if (data.workingHours.start && !timeRegex.test(data.workingHours.start)) {
        errors.push('Working hours start must be in HH:MM format.');
      }
      if (data.workingHours.end && !timeRegex.test(data.workingHours.end)) {
        errors.push('Working hours end must be in HH:MM format.');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateDoctorCreation,
  validateDoctorUpdate,
};
