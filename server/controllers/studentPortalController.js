'use strict';
const { pool } = require('../config/database');
const Booking = require('../models/Booking');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const bookingController = require('./bookingController');
const seatController = require('./seatController');
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');

async function dashboard(req, res) {
  const id = req.student.id;
  const [membership, bookings, attendance, payments] = await Promise.all([
    Membership.findAll({ student_id: id }),
    Booking.findAll({ student_id: id }),
    Attendance.findAll({ student_id: id }),
    Payment.findAll({ student_id: id })
  ]);
  return sendSuccess(res, {
    student: { id, fullName: req.student.full_name, mobile: req.student.mobile, email: req.student.email },
    membership: membership.find(item => item.status === 'active') || membership[0] || null,
    memberships: membership, bookings, attendance, payments
  });
}

async function getBookings(req, res) {
  return sendSuccess(res, await Booking.findAll({ student_id: req.student.id }));
}
async function getMembership(req, res) {
  return sendSuccess(res, await Membership.findAll({ student_id: req.student.id }));
}
async function getAttendance(req, res) {
  return sendSuccess(res, await Attendance.findAll({ student_id: req.student.id }));
}
async function getPayments(req, res) {
  return sendSuccess(res, await Payment.findAll({ student_id: req.student.id }));
}
async function profile(req, res) {
  if (req.method === 'GET') return sendSuccess(res, req.student);
  const allowed = ['full_name', 'email', 'date_of_birth', 'gender', 'address', 'city', 'state', 'pincode',
    'student_id_no', 'emergency_contact_name', 'emergency_contact_mobile', 'emergency_contact_rel'];
  const data = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
  if (Object.keys(data).length === 0) return sendError(res, 'No profile fields supplied.', 422);
  await require('../models/Student').update(req.student.id, data);
  return sendSuccess(res, await require('../models/Student').findById(req.student.id), 'Profile updated.');
}
async function createBooking(req, res) {
  req.body.student_id = req.student.id;
  return bookingController.createBooking(req, res);
}
async function cancelBooking(req, res) {
  const [result] = await pool.execute(
    "UPDATE bookings SET status = 'cancelled' WHERE id = ? AND student_id = ? AND status = 'active'",
    [req.params.id, req.student.id]
  );
  if (!result.affectedRows) return sendNotFound(res, 'Booking');
  return sendSuccess(res, null, 'Booking cancelled.');
}
async function seatAvailability(req, res) {
  return seatController.getSeatAvailability(req, res);
}
module.exports = { dashboard, getBookings, getMembership, getAttendance, getPayments, profile,
  createBooking, cancelBooking, seatAvailability };
