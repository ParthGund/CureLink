/**
 * Centralized authentication configuration.
 *
 * JWT expiration and cookie lifetime are kept in sync here
 * to prevent mismatches between token validity and cookie duration.
 */

const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

/**
 * Parse a duration string like '7d', '24h', '30m' into milliseconds.
 * Falls back to 7 days if the format is unrecognised.
 */
function parseExpireToMs(expire) {
  const match = expire.match(/^(\d+)([dhm])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // 7 days default

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd': return value * 24 * 60 * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'm': return value * 60 * 1000;
    default:  return 7 * 24 * 60 * 60 * 1000;
  }
}

const COOKIE_MAX_AGE_MS = parseExpireToMs(JWT_EXPIRE);

module.exports = {
  JWT_EXPIRE,
  COOKIE_MAX_AGE_MS,
};
