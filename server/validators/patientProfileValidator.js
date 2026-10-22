const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PATIENT_PROFILE_FIELDS = [
  'name', 'email', 'phone', 'dateOfBirth', 'gender', 'bloodGroup', 'address',
  'emergencyContact', 'allergies', 'chronicConditions', 'surgeries',
  'currentMedications',
];

function validatePatientProfileUpdate(data) {
  const errors = [];
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Profile update must be an object.'] };
  }

  for (const key of Object.keys(data)) {
    if (!PATIENT_PROFILE_FIELDS.includes(key)) {
      errors.push(`Field "${key}" cannot be updated through the patient profile.`);
    }
  }
  if (Object.keys(data).length === 0) {
    errors.push('At least one profile field is required.');
  }

  if (data.name !== undefined && (
    typeof data.name !== 'string' || data.name.trim().length === 0 || data.name.trim().length > 100
  )) {
    errors.push('Name must be a non-empty string of 100 characters or fewer.');
  }
  if (data.email !== undefined && (
    typeof data.email !== 'string' || !EMAIL_REGEX.test(data.email.trim()) || data.email.length > 254
  )) {
    errors.push('A valid email address is required.');
  }

  const stringLimits = {
    phone: 30,
    address: 300,
    emergencyContact: 100,
    allergies: 2000,
    chronicConditions: 2000,
    surgeries: 2000,
    currentMedications: 2000,
  };
  for (const [field, max] of Object.entries(stringLimits)) {
    if (data[field] !== undefined && (
      typeof data[field] !== 'string' || data[field].length > max
    )) {
      errors.push(`${field} must be text of ${max} characters or fewer.`);
    }
  }

  if (data.dateOfBirth !== undefined && data.dateOfBirth !== '') {
    const date = data.dateOfBirth;
    const parsed = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? new Date(`${date}T00:00:00.000Z`)
      : null;
    const validDate = parsed && !Number.isNaN(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === date && parsed <= new Date();
    if (!validDate) errors.push('Date of birth must be a valid date that is not in the future.');
  } else if (data.dateOfBirth !== undefined && typeof data.dateOfBirth !== 'string') {
    errors.push('Date of birth must be a date string or empty.');
  }

  if (data.gender !== undefined && data.gender !== '' && !GENDERS.includes(data.gender)) {
    errors.push('Select a valid gender or leave it empty.');
  }
  if (data.bloodGroup !== undefined && data.bloodGroup !== '' && !BLOOD_GROUPS.includes(data.bloodGroup)) {
    errors.push('Select a valid blood group or leave it empty.');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validatePatientProfileUpdate };
