/**
 * Handle requests to undefined routes.
 */
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Not found: ${req.originalUrl}`,
  });
};

/**
 * Global error handler.
 * Returns stack trace only in development.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Ensure errors thrown with a specific status code use it
  if (err.statusCode) statusCode = err.statusCode;
  if (err.status) statusCode = err.status;

  // Log all errors internally
  console.error(`[Error] ${req.method} ${req.originalUrl} >>`, err);

  const isDev = process.env.NODE_ENV === 'development';
  let message = 'Internal server error.';

  if (isDev) {
    message = err.message || message;
  } else if (statusCode < 500) {
    // In production, only expose messages for client errors (4xx)
    message = err.message || message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: isDev ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
