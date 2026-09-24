/**
 * Server-side validation for authentication requests.
 *
 * These validators run on the server regardless of frontend validation.
 * They return { valid, errors } where errors is an array of message strings.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_NAME_LENGTH = 100;

/**
 * Validate registration input.
 *
 * @param {object} data - { name, email, password }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateRegistration(data) {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.push('Name is required.');
  } else if (data.name.trim().length > MAX_NAME_LENGTH) {
    errors.push(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
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

  return { valid: errors.length === 0, errors };
}

/**
 * Validate login input.
 *
 * @param {object} data - { email, password }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLogin(data) {
  const errors = [];

  if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
    errors.push('Email is required.');
  }

  if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
    errors.push('Password is required.');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  validateRegistration,
  validateLogin,
};
