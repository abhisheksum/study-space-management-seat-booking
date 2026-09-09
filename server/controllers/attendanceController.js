/**
 * StudyHub — Attendance Controller
 * Gate check-in / check-out for daily student presence logging.
 */
'use strict';

const Attendance                   = require('../models/Attendance');
const { validateAttendanceCheckIn } = require('../middleware/validate');
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');

/**
 * POST /api/attendance
 * Record a student check-in.
 */
async function checkIn(req, res) {
  const errors = validateAttendanceCheckIn(req.body);
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);

  if (!req.body.booking_id) return sendError(res, 'booking_id is required for check-in.', 422);
  let id;
  try {
    id = await Attendance.checkInValidated(req.body);
  } catch (error) {
    if (error.statusCode) return sendError(res, error.message, error.statusCode);
    throw error;
  }
  const record = await Attendance.findById(id);
  return sendSuccess(res, record, 'Check-in recorded.', 201);
}

/**
 * PATCH /api/attendance/:id/checkout
 * Record a student check-out by attendance record ID.
 */
async function checkOut(req, res) {
  const done = await Attendance.checkOut(req.params.id);
  if (!done) {
    return sendError(
      res,
      'Attendance record not found, or check-out was already recorded for this session.',
      404
    );
  }
  const record = await Attendance.findById(req.params.id);
  return sendSuccess(res, record, 'Check-out recorded.');
}

/**
 * GET /api/attendance
 * List attendance records. Supports ?student_id=, ?date=, ?seat_id=
 */
async function getAttendance(req, res) {
  const filters = {
    student_id: req.query.student_id || null,
    date:       req.query.date       || null,
    seat_id:    req.query.seat_id    || null
  };
  const records = await Attendance.findAll(filters);
  return sendSuccess(res, records, 'Attendance retrieved.', 200, { count: records.length });
}

/**
 * GET /api/attendance/:id
 */
async function getAttendanceById(req, res) {
  const record = await Attendance.findById(req.params.id);
  if (!record) return sendNotFound(res, 'Attendance record');
  return sendSuccess(res, record);
}

module.exports = { checkIn, checkOut, getAttendance, getAttendanceById };
