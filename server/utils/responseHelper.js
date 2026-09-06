/**
 * StudyHub — HTTP Response Helpers
 * 
 * Standardised JSON envelope used by all controllers:
 * 
 * SUCCESS:
 * { success: true, message: "...", data: {...}, meta: {...} }
 * 
 * ERROR:
 * { success: false, message: "...", errors: [...] }
 */
'use strict';

/**
 * Send a successful JSON response.
 * 
 * @param {import('express').Response} res
 * @param {any}    data        - Payload (object, array, null)
 * @param {string} [message]   - Human-readable success message
 * @param {number} [status=200]
 * @param {object} [meta]      - Optional pagination / count metadata
 */
function sendSuccess(res, data, message = 'OK', status = 200, meta = null) {
  const body = {
    success: true,
    message,
    data
  };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

/**
 * Send an error JSON response.
 * 
 * @param {import('express').Response} res
 * @param {string}   message       - Human-readable error summary
 * @param {number}   [status=400]
 * @param {Array}    [errors=[]]   - Array of field-level validation errors
 */
function sendError(res, message = 'Bad Request', status = 400, errors = []) {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
}

/**
 * Send a 404 Not Found response.
 * @param {import('express').Response} res
 * @param {string} resource - e.g. "Student", "Booking"
 */
function sendNotFound(res, resource = 'Resource') {
  return sendError(res, `${resource} not found.`, 404);
}

module.exports = { sendSuccess, sendError, sendNotFound };
