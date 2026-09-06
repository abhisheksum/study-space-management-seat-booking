/**
 * StudyHub — Membership Controller
 * Links a student to a plan + seat for a monthly subscription period.
 */
'use strict';

const Membership                   = require('../models/Membership');
const MembershipPlan               = require('../models/MembershipPlan');
const Seat                         = require('../models/Seat');
const { validateMembership }       = require('../middleware/validate');
const { sendSuccess, sendError, sendNotFound } = require('../utils/responseHelper');

/**
 * POST /api/memberships
 * Create a new membership after verifying plan and seat exist.
 */
async function createMembership(req, res) {
  const errors = validateMembership(req.body);
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);

  const { student_id, plan_id, seat_id, start_date } = req.body;

  // Verify plan exists
  const plan = await MembershipPlan.findById(plan_id);
  if (!plan) return sendError(res, `Membership plan ID ${plan_id} not found.`, 404);

  // Verify seat exists
  const seat = await Seat.findById(seat_id);
  if (!seat) return sendError(res, `Seat ID ${seat_id} not found.`, 404);

  // Calculate end date from plan duration
  const start  = new Date(start_date);
  const end    = new Date(start);
  end.setDate(end.getDate() + (plan.duration_days || 30));
  const end_date = end.toISOString().split('T')[0];

  const id = await Membership.create({ student_id, plan_id, seat_id, start_date, end_date });
  const membership = await Membership.findById(id);

  return sendSuccess(res, membership, 'Membership created successfully.', 201);
}

/**
 * GET /api/memberships
 * List memberships. Supports ?student_id=, ?status=
 */
async function getAllMemberships(req, res) {
  const filters = {
    student_id: req.query.student_id || null,
    status:     req.query.status     || null
  };
  const memberships = await Membership.findAll(filters);
  return sendSuccess(res, memberships, 'Memberships retrieved.', 200, { count: memberships.length });
}

/**
 * GET /api/memberships/:id
 */
async function getMembershipById(req, res) {
  const membership = await Membership.findById(req.params.id);
  if (!membership) return sendNotFound(res, 'Membership');
  return sendSuccess(res, membership);
}

/**
 * PATCH /api/memberships/:id/status
 * Admin: activate, expire, or cancel a membership.
 */
async function updateMembershipStatus(req, res) {
  const allowed = ['pending', 'active', 'expired', 'cancelled'];
  const { status } = req.body;
  if (!allowed.includes(status)) {
    return sendError(res, `status must be one of: ${allowed.join(', ')}`);
  }
  const done = await Membership.updateStatus(req.params.id, status);
  if (!done) return sendNotFound(res, 'Membership');
  return sendSuccess(res, null, `Membership status updated to "${status}".`);
}

module.exports = { createMembership, getAllMemberships, getMembershipById, updateMembershipStatus };
