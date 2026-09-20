/**
 * Create an Error with an HTTP status code attached.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Human-readable error message.
 * @returns {Error} Error instance with a `statusCode` property.
 */
function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Send a JSON error response.
 *
 * If the error has a `statusCode` (i.e. it was created via `httpError`),
 * respond with that status and the error's own message.
 * Otherwise respond with 500 and the provided `fallbackMessage`,
 * so that raw stack traces and database errors are never leaked.
 *
 * @param {object} res - Express response object.
 * @param {Error}  error - The caught error.
 * @param {string} fallbackMessage - Safe message for unexpected errors.
 */
function sendError(res, error, fallbackMessage) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
}

module.exports = { httpError, sendError };
