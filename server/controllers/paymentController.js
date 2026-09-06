/**
 * StudyHub — Payment Controller
 */
'use strict';

const Payment                      = require('../models/Payment');
const { validatePayment }          = require('../middleware/validate');
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');

/**
 * POST /api/payments
 * Record a new payment (cash receipt, UPI confirmation, etc.)
 */
async function recordPayment(req, res) {
  const errors = validatePayment(req.body);
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);

  const id      = await Payment.create(req.body);
  const payment = await Payment.findById(id);

  // If this payment marks a membership as active, the caller should also
  // PATCH /api/memberships/:id/status { status: 'active' }
  // (kept separate so payment and membership concerns don't couple here)

  return sendSuccess(res, payment, 'Payment recorded.', 201);
}

/**
 * GET /api/payments
 * List payments. Supports ?student_id=, ?status=, ?from_date=, ?to_date=
 */
async function getAllPayments(req, res) {
  const filters = {
    student_id: req.query.student_id || null,
    status:     req.query.status     || null,
    from_date:  req.query.from_date  || null,
    to_date:    req.query.to_date    || null
  };
  const payments = await Payment.findAll(filters);
  return sendSuccess(res, payments, 'Payments retrieved.', 200, { count: payments.length });
}

/**
 * GET /api/payments/:id
 */
async function getPaymentById(req, res) {
  const payment = await Payment.findById(req.params.id);
  if (!payment) return sendNotFound(res, 'Payment');
  return sendSuccess(res, payment);
}

/**
 * PATCH /api/payments/:id/status
 * Confirm or reject a payment. Body: { status, transaction_id? }
 */
async function updatePaymentStatus(req, res) {
  const allowed = ['pending', 'completed', 'failed', 'refunded'];
  const { status, transaction_id } = req.body;
  if (!allowed.includes(status)) {
    return sendError(res, `status must be one of: ${allowed.join(', ')}`);
  }
  const done = await Payment.updateStatus(req.params.id, status, transaction_id || null);
  if (!done) return sendNotFound(res, 'Payment');
  return sendSuccess(res, null, `Payment status updated to "${status}".`);
}

/**
 * GET /api/payments/stats/today
 * Today's total revenue (admin dashboard card).
 */
async function todayRevenue(req, res) {
  const total = await Payment.todayRevenue();
  return sendSuccess(res, { revenue: total, currency: 'INR' }, "Today's revenue retrieved.");
}

module.exports = { recordPayment, getAllPayments, getPaymentById, updatePaymentStatus, todayRevenue };
