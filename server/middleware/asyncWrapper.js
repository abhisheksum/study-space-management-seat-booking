/**
 * StudyHub — Async Wrapper Middleware
 * 
 * Wraps async route handlers so any thrown error is forwarded to
 * Express's next(err) without requiring try/catch in every controller.
 * 
 * Usage:
 *   router.post('/students', asyncWrapper(studentController.createStudent));
 */
'use strict';

/**
 * @param {Function} fn - Async express route handler
 * @returns {Function}    Express-compatible middleware
 */
const asyncWrapper = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncWrapper;
