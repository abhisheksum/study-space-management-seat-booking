/**
 * StudyHub — Booking Controller
 * 
 * CRITICAL: This controller enforces the anti-overlap rule server-side.
 * 
 * Flow for POST /api/bookings:
 *   1. Validate request body
 *   2. Look up seat ID and slot definition
 *   3. Call checkSeatOverlap() — queries DB for conflicting active bookings
 *   4. If conflict → reject with 409 Conflict + conflict details
 *   5. If clear → insert booking
 */
'use strict';

const Booking                      = require('../models/Booking');
const { SLOT_TIME_WINDOWS }        = require('../config/constants');
const { pool }                     = require('../config/database');
const { validateBooking }          = require('../middleware/validate');
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');

/**
 * POST /api/bookings
 * Create a new booking with anti-overlap enforcement.
 */
async function createBooking(req, res) {
  // 1. Validate
  const errors = validateBooking(req.body);
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);

  const { seat_id, slot_key, booking_date, membership_id, notes } = req.body;
  const student_id = req.student ? req.student.id : req.body.student_id;
  if (!student_id) return sendError(res, 'Authenticated student identity is required.', 422);

  // Resolve the slot definition before opening the transaction.
  const slotDef = SLOT_TIME_WINDOWS[slot_key];
  if (!slotDef) {
    return sendError(res, `Unknown slot_key: "${slot_key}". Valid: ${Object.keys(SLOT_TIME_WINDOWS).join(', ')}.`);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [students] = await connection.execute(
      'SELECT id FROM students WHERE id = ? AND is_active = 1 LIMIT 1',
      [student_id]
    );
    if (!students[0]) {
      await connection.rollback();
      return sendError(res, `Active student ID ${student_id} not found.`, 404);
    }

    if (!membership_id) {
      await connection.rollback();
      return sendError(res, 'membership_id is required for a booking.', 422);
    }
    const [memberships] = await connection.execute(`
      SELECT id, student_id, seat_id, status, start_date, end_date
      FROM memberships
      WHERE id = ?
      LIMIT 1
    `, [membership_id]);
    const membership = memberships[0];
    if (!membership) {
      await connection.rollback();
      return sendError(res, `Membership ID ${membership_id} not found.`, 404);
    }
    if (membership.student_id !== Number(student_id)) {
      await connection.rollback();
      return sendError(res, 'Membership does not belong to the supplied student.', 409);
    }
    if (membership.status !== 'active') {
      await connection.rollback();
      return sendError(res, 'Membership is not active and cannot create a booking.', 409);
    }
    if (membership.seat_id !== Number(seat_id)) {
      await connection.rollback();
      return sendError(res, 'Booking seat does not match the membership seat.', 409);
    }
    const dateOnly = (value) => value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value).slice(0, 10);
    if (booking_date < dateOnly(membership.start_date) ||
        booking_date >= dateOnly(membership.end_date)) {
      await connection.rollback();
      return sendError(res, 'Booking date must fall within the membership period.', 422);
    }

    // Lock the physical seat row. All bookings for this seat serialize here.
    const [seats] = await connection.execute(
      'SELECT id, seat_number, status FROM seats WHERE id = ? FOR UPDATE',
      [seat_id]
    );
    const seat = seats[0];
    if (!seat) {
      await connection.rollback();
      return sendError(res, `Seat ID ${seat_id} does not exist.`, 404);
    }
    if (seat.status !== 'active') {
      await connection.rollback();
      return sendError(res, `Seat ${seat.seat_number} is currently under maintenance and cannot be booked.`, 422);
    }

    const [conflicts] = await connection.execute(`
      SELECT id, slot_key, start_hour, end_hour
      FROM bookings
      WHERE seat_id = ?
        AND booking_date = ?
        AND status = 'active'
        AND start_hour < ?
        AND end_hour > ?
      LIMIT 1
    `, [seat_id, booking_date, slotDef.endHour, slotDef.startHour]);
    if (conflicts[0]) {
      const conflict = conflicts[0];
      await connection.rollback();
      return sendError(
        res,
        `Seat ${seat.seat_number} is already booked from ${conflict.start_hour}:00–${conflict.end_hour}:00 (slot: ${conflict.slot_key}) on ${booking_date}.`,
        409,
        [{ field: 'seat_id', message: 'Overlapping booking exists', conflict }]
      );
    }

    const bookingId = await Booking.createWithConnection(connection, {
      membership_id, student_id, seat_id, slot_key, booking_date,
      start_hour: slotDef.startHour, end_hour: slotDef.endHour, notes
    });
    await connection.commit();
    const booking = await Booking.findById(bookingId);
    return sendSuccess(res, booking, 'Booking created successfully.', 201);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * GET /api/bookings
 * List bookings. Supports ?student_id=, ?seat_id=, ?date=, ?status=
 */
async function getAllBookings(req, res) {
  const filters = {
    student_id: req.query.student_id || null,
    seat_id:    req.query.seat_id    || null,
    date:       req.query.date       || null,
    status:     req.query.status     || null
  };
  const bookings = await Booking.findAll(filters);
  return sendSuccess(res, bookings, 'Bookings retrieved.', 200, { count: bookings.length });
}

/**
 * GET /api/bookings/:id
 */
async function getBookingById(req, res) {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return sendNotFound(res, 'Booking');
  return sendSuccess(res, booking);
}

/**
 * PATCH /api/bookings/:id/cancel
 */
async function cancelBooking(req, res) {
  const done = await Booking.cancel(req.params.id);
  if (!done) return sendNotFound(res, 'Booking');
  return sendSuccess(res, null, 'Booking cancelled.');
}

/**
 * PATCH /api/bookings/:id/complete
 */
async function completeBooking(req, res) {
  const done = await Booking.complete(req.params.id);
  if (!done) return sendNotFound(res, 'Booking');
  return sendSuccess(res, null, 'Booking marked as completed.');
}

module.exports = { createBooking, getAllBookings, getBookingById, cancelBooking, completeBooking };
