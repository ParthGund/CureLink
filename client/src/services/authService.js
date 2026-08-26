import api from './api';

/**
 * Register a new patient account.
 * @param {{ name: string, email: string, password: string }} credentials
 */
export function register(credentials) {
  return api('/auth/register', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Log in with email and password.
 * @param {{ email: string, password: string }} credentials
 */
export function login(credentials) {
  return api('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Log out and clear the server-side cookie.
 */
export function logout() {
  return api('/auth/logout', { method: 'POST' });
}

/**
 * Get the currently authenticated user's profile.
 */
export function getMe() {
  return api('/auth/me');
}
