'use strict';

const Seat = require('../models/Seat');
const MembershipPlan = require('../models/MembershipPlan');
const Student = require('../models/Student');
const Booking = require('../models/Booking');
const Membership = require('../models/Membership');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');

const positiveId = (value, field) => Number.isInteger(Number(value)) && Number(value) > 0 ? null : `${field} must be a positive integer.`;

async function updateSeat(req, res) {
  const errors = [positiveId(req.params.id, 'id')].filter(Boolean);
  if (req.body.status && !['active', 'maintenance', 'inactive'].includes(req.body.status)) errors.push('Invalid seat status.');
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);
  if (!await Seat.update(req.params.id, req.body)) return sendNotFound(res, 'Seat');
  return sendSuccess(res, await Seat.findById(req.params.id), 'Seat updated.');
}

async function createSeat(req, res) {
  const { seat_number, zone, row_position, status, notes } = req.body;
  const errors = [];
  if (!/^[A-C]\d{2}$/.test(String(seat_number || ''))) errors.push('seat_number must look like A01.');
  if (!['A', 'B', 'C'].includes(zone)) errors.push('zone must be A, B, or C.');
  if (!Number.isInteger(Number(row_position)) || Number(row_position) < 1 || Number(row_position) > 10) errors.push('row_position must be between 1 and 10.');
  if (status && !['active', 'maintenance', 'inactive'].includes(status)) errors.push('Invalid seat status.');
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);
  const id = await Seat.create({ seat_number, zone, row_position, status, notes });
  return sendSuccess(res, await Seat.findById(id), 'Seat created.', 201);
}

async function updatePlan(req, res) {
  const data = req.body;
  const errors = [];
  if (data.name !== undefined && (!String(data.name).trim() || String(data.name).length > 80)) errors.push('name is required and must be at most 80 characters.');
  if (data.type !== undefined && !['full_day', 'half_day', 'slot'].includes(data.type)) errors.push('Invalid plan type.');
  if (data.price !== undefined && (!Number.isFinite(Number(data.price)) || Number(data.price) < 0)) errors.push('price must be non-negative.');
  if (data.duration_days !== undefined && (!Number.isInteger(Number(data.duration_days)) || Number(data.duration_days) < 1)) errors.push('duration_days must be positive.');
  if (data.is_active !== undefined && ![true, false, 0, 1].includes(data.is_active)) errors.push('is_active must be boolean.');
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);
  if (!await MembershipPlan.update(req.params.id, { ...data, is_active: data.is_active === true ? 1 : data.is_active === false ? 0 : data.is_active })) return sendNotFound(res, 'Membership plan');
  return sendSuccess(res, await MembershipPlan.findById(req.params.id), 'Membership plan updated.');
}

async function createPlan(req, res) {
  const errors = [];
  for (const field of ['name', 'type', 'price', 'duration_days']) if (req.body[field] === undefined) errors.push(`${field} is required.`);
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);
  const validation = [];
  if (!['full_day', 'half_day', 'slot'].includes(req.body.type)) validation.push('Invalid plan type.');
  if (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) < 0) validation.push('price must be non-negative.');
  if (!Number.isInteger(Number(req.body.duration_days)) || Number(req.body.duration_days) < 1) validation.push('duration_days must be positive.');
  if (validation.length) return sendError(res, 'Validation failed', 422, validation);
  const id = await MembershipPlan.create(req.body);
  return sendSuccess(res, await MembershipPlan.findById(id), 'Membership plan created.', 201);
}

async function updateStudent(req, res) {
  if (!positiveId(req.params.id, 'id')) return sendError(res, 'Validation failed', 422, [positiveId(req.params.id, 'id')]);
  if (!await Student.update(req.params.id, req.body)) return sendNotFound(res, 'Student');
  return sendSuccess(res, await Student.findById(req.params.id), 'Student updated.');
}

async function updateBooking(req, res) {
  const allowed = ['active', 'cancelled', 'completed'];
  if (!allowed.includes(req.body.status)) return sendError(res, 'status must be active, cancelled, or completed.', 422);
  const done = req.body.status === 'cancelled' ? await Booking.cancel(req.params.id) : req.body.status === 'completed' ? await Booking.complete(req.params.id) : false;
  if (!done) return sendNotFound(res, 'Booking');
  return sendSuccess(res, await Booking.findById(req.params.id), 'Booking status updated.');
}

async function updateMembership(req, res) {
  if (!['pending', 'active', 'expired', 'cancelled'].includes(req.body.status)) return sendError(res, 'Invalid membership status.', 422);
  if (!await Membership.updateStatus(req.params.id, req.body.status)) return sendNotFound(res, 'Membership');
  return sendSuccess(res, await Membership.findById(req.params.id), 'Membership status updated.');
}

async function updatePayment(req, res) {
  if (!['pending', 'completed', 'failed', 'refunded'].includes(req.body.status)) return sendError(res, 'Invalid payment status.', 422);
  if (!await Payment.updateStatus(req.params.id, req.body.status, req.body.transaction_id || null)) return sendNotFound(res, 'Payment');
  return sendSuccess(res, await Payment.findById(req.params.id), 'Payment status updated.');
}

async function checkoutAttendance(req, res) {
  if (!await Attendance.checkOut(req.params.id)) return sendNotFound(res, 'Attendance record');
  return sendSuccess(res, await Attendance.findById(req.params.id), 'Check-out recorded.');
}

module.exports = { updateSeat, createSeat, updatePlan, createPlan, updateStudent, updateBooking, updateMembership, updatePayment, checkoutAttendance };
