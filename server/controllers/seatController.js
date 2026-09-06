/**
 * StudyHub — Seat Controller
 * Handles: GET /api/seats, GET /api/seats/availability
 */
'use strict';

const Seat                         = require('../models/Seat');
const { SLOT_TIME_WINDOWS }        = require('../config/constants');
const { sendSuccess, sendError }   = require('../utils/responseHelper');

/**
 * GET /api/seats
 * Return all 30 physical seats with their physical status.
 */
async function getAllSeats(req, res) {
  const seats = await Seat.findAll();
  return sendSuccess(res, seats, 'Seats retrieved.', 200, { count: seats.length });
}

/**
 * GET /api/seats/availability?date=YYYY-MM-DD&slot=morning
 * Returns each seat with its availability for the requested date + slot.
 * 
 * This is the endpoint the frontend seat map page calls.
 * Response structure mirrors the MOCK_BOOKINGS data in js/seats.js.
 */
async function getSeatAvailability(req, res) {
  const { date, slot } = req.query;

  if (!date) return sendError(res, 'Query param `date` (YYYY-MM-DD) is required.');
  if (!slot) return sendError(res, 'Query param `slot` is required (morning|afternoon|evening|half-day-am|half-day-pm|full-day).');

  const slotDef = SLOT_TIME_WINDOWS[slot];
  if (!slotDef) {
    return sendError(res, `Unknown slot key: "${slot}". Valid keys: ${Object.keys(SLOT_TIME_WINDOWS).join(', ')}.`);
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return sendError(res, 'Invalid date format. Use YYYY-MM-DD.');
  }

  const seats = await Seat.getAvailability(date, slotDef.startHour, slotDef.endHour);

  // Enrich response to match frontend expectations
  const enriched = seats.map(s => ({
    id:             s.id,
    seatNumber:     s.seat_number,
    zone:           s.zone,
    rowPosition:    s.row_position,
    physicalStatus: s.seat_status,
    status:         s.booking_status,  // 'available' | 'active' | 'completed' | 'cancelled' | 'maintenance'
    slotKey:        s.slot_key || null,
    bookingId:      s.booking_id || null
  }));

  const stats = {
    total:     enriched.length,
    available: enriched.filter(s => s.status === 'available').length,
    occupied:  enriched.filter(s => s.status === 'active').length,
    date,
    slot,
    slotLabel: slotDef.label
  };

  return sendSuccess(res, enriched, 'Seat availability retrieved.', 200, stats);
}

/**
 * PATCH /api/seats/:id/status
 * Update seat physical status (admin use: active/maintenance/inactive).
 */
async function updateSeatStatus(req, res) {
  const { status } = req.body;
  const allowed = ['active', 'maintenance', 'inactive'];
  if (!allowed.includes(status)) {
    return sendError(res, `status must be one of: ${allowed.join(', ')}`);
  }
  const updated = await Seat.updateStatus(req.params.id, status);
  if (!updated) return sendError(res, 'Seat not found.', 404);
  return sendSuccess(res, null, `Seat status updated to "${status}".`);
}

module.exports = { getAllSeats, getSeatAvailability, updateSeatStatus };
