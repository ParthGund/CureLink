const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Make an API request to the CureLink backend.
 *
 * @param {string} endpoint - API path (e.g. '/auth/login').
 * @param {object} [options] - Fetch options override.
 * @returns {Promise<object>} Parsed JSON response.
 */
async function api(endpoint, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong.');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default api;
