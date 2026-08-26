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
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error.',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { notFound, errorHandler };
