/**
 * StudyHub — Global Error Handler Middleware
 * 
 * Must be registered LAST in the Express middleware chain (after all routes).
 * Catches any error forwarded via next(err) and returns a consistent JSON envelope.
 */
'use strict';

/**
 * @param {Error}                      err
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {Function}                   next
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Log full stack in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('🔴 [ErrorHandler]', err.stack || err.message);
  } else {
    console.error('🔴 [ErrorHandler]', err.message);
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Profile photo must be 3 MB or smaller.',
      errors: []
    });
  }

  // MySQL duplicate entry (ER_DUP_ENTRY)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'A record with the same unique value already exists.',
      detail:  err.sqlMessage || null
    });
  }

  // MySQL foreign key constraint failure
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(422).json({
      success: false,
      message: 'Referenced record does not exist (foreign key constraint).',
      detail:  err.sqlMessage || null
    });
  }

  // Validation error from our own middleware (custom shape)
  if (err.isValidationError) {
    return res.status(422).json({
      success: false,
      message: err.message,
      errors:  err.errors || []
    });
  }

  // Generic fallback
  const status = err.statusCode || err.status || 500;
  return res.status(status).json({
    success: false,
    message: status === 500
      ? 'Internal server error. Please try again later.'
      : err.message,
    // Only expose stack in development
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}

module.exports = errorHandler;
