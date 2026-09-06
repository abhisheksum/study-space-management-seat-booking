/**
 * StudyHub — Request Validation Helpers
 * 
 * Lightweight inline validators (no external library required).
 * Each validator returns an error message string or null if valid.
 * 
 * Usage in controllers:
 *   const errors = validateStudent(req.body);
 *   if (errors.length) return sendError(res, 'Validation failed', 422, errors);
 */
'use strict';

// ---------------------------------------------------------------------------
// Field-level validators (return error message string or null)
// ---------------------------------------------------------------------------

/** @param {string} val */
const isRequired = (val, fieldName) =>
  (!val || String(val).trim() === '')
    ? `${fieldName} is required.`
    : null;

/** @param {string} email */
const isEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))
    ? null
    : 'Must be a valid email address.';

/** @param {string} mobile - Indian 10-digit */
const isMobile = (mobile) =>
  /^[6-9]\d{9}$/.test(String(mobile || '').replace(/[\s\-+]/g, ''))
    ? null
    : 'Must be a valid 10-digit Indian mobile number (starts with 6-9).';

/** @param {string} pincode */
const isPincode = (pincode) =>
  /^\d{6}$/.test(String(pincode || ''))
    ? null
    : 'Pincode must be exactly 6 digits.';

/** @param {string} date - YYYY-MM-DD */
const isDateString = (date) => {
  if (!date) return 'Date is required.';
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'Must be a valid date (YYYY-MM-DD).' : null;
};

/** @param {any} val */
const isPositiveNumber = (val, fieldName) => {
  const n = parseFloat(val);
  return (!isNaN(n) && n > 0) ? null : `${fieldName} must be a positive number.`;
};

// ---------------------------------------------------------------------------
// Composite schema validators used by controllers
// ---------------------------------------------------------------------------

/**
 * Validate POST /api/students body
 * @param {object} body
 * @returns {string[]} Array of error messages (empty = valid)
 */
function validateStudent(body) {
  const errors = [];
  const push = (v) => { if (v) errors.push(v); };

  push(isRequired(body.full_name, 'Full name'));
  push(isRequired(body.mobile,    'Mobile number'));

  const mobileErr = isMobile(body.mobile);
  if (mobileErr) push(mobileErr);

  if (body.email) {
    const emailErr = isEmail(body.email);
    if (emailErr) push(emailErr);
  }

  if (body.pincode) {
    const pincodeErr = isPincode(body.pincode);
    if (pincodeErr) push(pincodeErr);
  }

  if (body.emergency_contact_mobile) {
    const emErr = isMobile(body.emergency_contact_mobile);
    if (emErr) errors.push(`Emergency contact mobile: ${emErr}`);
  }

  return errors;
}

/**
 * Validate POST /api/bookings body
 * @param {object} body
 * @returns {string[]}
 */
function validateBooking(body) {
  const errors = [];
  const push = (v) => { if (v) errors.push(v); };

  push(isRequired(body.student_id,   'student_id'));
  push(isRequired(body.seat_id,      'seat_id'));
  push(isRequired(body.slot_key,     'slot_key'));
  push(isRequired(body.booking_date, 'booking_date'));

  if (body.booking_date) push(isDateString(body.booking_date));

  return errors;
}

/**
 * Validate POST /api/memberships body
 * @param {object} body
 * @returns {string[]}
 */
function validateMembership(body) {
  const errors = [];
  const push = (v) => { if (v) errors.push(v); };

  push(isRequired(body.student_id, 'student_id'));
  push(isRequired(body.plan_id,    'plan_id'));
  push(isRequired(body.seat_id,    'seat_id'));
  push(isRequired(body.start_date, 'start_date'));

  if (body.start_date) push(isDateString(body.start_date));

  return errors;
}

/**
 * Validate POST /api/payments body
 * @param {object} body
 * @returns {string[]}
 */
function validatePayment(body) {
  const errors = [];
  const push = (v) => { if (v) errors.push(v); };

  push(isRequired(body.student_id, 'student_id'));
  push(isRequired(body.amount,     'amount'));

  const amountErr = isPositiveNumber(body.amount, 'Amount');
  if (amountErr) push(amountErr);

  return errors;
}

/**
 * Validate POST /api/attendance (check-in) body
 * @param {object} body
 * @returns {string[]}
 */
function validateAttendanceCheckIn(body) {
  const errors = [];
  const push = (v) => { if (v) errors.push(v); };

  push(isRequired(body.student_id,   'student_id'));
  push(isRequired(body.seat_id,      'seat_id'));
  push(isRequired(body.slot_key,     'slot_key'));
  push(isRequired(body.booking_date, 'booking_date'));

  if (body.booking_date) push(isDateString(body.booking_date));

  return errors;
}

module.exports = {
  validateStudent,
  validateBooking,
  validateMembership,
  validatePayment,
  validateAttendanceCheckIn,
  // Expose individual validators for ad-hoc use
  isRequired,
  isEmail,
  isMobile,
  isPincode,
  isDateString,
  isPositiveNumber
};
