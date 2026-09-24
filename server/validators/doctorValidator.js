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

module.exports = {
  validateDoctorCreation,
};
