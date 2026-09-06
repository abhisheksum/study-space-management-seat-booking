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
const Seat                         = require('../models/Seat');
const { SLOT_TIME_WINDOWS }        = require('../config/constants');
const { checkSeatOverlap }         = require('../utils/overlapChecker');
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

  const { student_id, seat_id, slot_key, booking_date, membership_id, notes } = req.body;

  // 2. Resolve slot definition
  const slotDef = SLOT_TIME_WINDOWS[slot_key];
  if (!slotDef) {
    return sendError(res, `Unknown slot_key: "${slot_key}". Valid: ${Object.keys(SLOT_TIME_WINDOWS).join(', ')}.`);
  }

  // 3. Verify seat exists
  const seat = await Seat.findById(seat_id);
  if (!seat) return sendError(res, `Seat ID ${seat_id} does not exist.`, 404);
  if (seat.status !== 'active') {
    return sendError(res, `Seat ${seat.seat_number} is currently under maintenance and cannot be booked.`, 422);
  }

  // 4. ⚑ ANTI-OVERLAP CHECK — the core business rule
  const overlapResult = await checkSeatOverlap(
    pool,
    seat_id,
    booking_date,
    slotDef.startHour,
    slotDef.endHour
  );

  if (!overlapResult.available) {
    const c = overlapResult.conflict;
    return sendError(
      res,
      `Seat ${seat.seat_number} is already booked from ${c.startHour}:00–${c.endHour}:00 ` +
      `(slot: ${c.slotKey}) on ${booking_date}. ` +
      `Choose a different seat or a non-overlapping time slot.`,
      409,
      [{ field: 'seat_id', message: 'Overlapping booking exists', conflict: c }]
    );
  }

  // 5. Insert booking
  const bookingId = await Booking.create({
    membership_id: membership_id || null,
    student_id,
    seat_id,
    slot_key,
    booking_date,
    start_hour: slotDef.startHour,
    end_hour:   slotDef.endHour,
    notes:      notes || null
  });

  const booking = await Booking.findById(bookingId);
  return sendSuccess(res, booking, 'Booking created successfully.', 201);
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
