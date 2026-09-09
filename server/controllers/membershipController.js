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
const { pool } = require('../config/database');

/**
 * POST /api/memberships
 * Create a new membership after verifying plan and seat exist.
 */
async function createMembership(req, res) {
  const errors = validateMembership(req.body);
  if (errors.length) return sendError(res, 'Validation failed', 422, errors);

  const { student_id, plan_id, seat_id, start_date } = req.body;
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

    const [plans] = await connection.execute(
      'SELECT id, name, type, duration_days, is_active FROM membership_plans WHERE id = ? LIMIT 1',
      [plan_id]
    );
    const plan = plans[0];
    if (!plan) {
      await connection.rollback();
      return sendError(res, `Membership plan ID ${plan_id} not found.`, 404);
    }
    if (!plan.is_active) {
      await connection.rollback();
      return sendError(res, `Membership plan "${plan.name}" is inactive.`, 409);
    }

    const [seats] = await connection.execute(
      'SELECT id, seat_number, status FROM seats WHERE id = ? LIMIT 1',
      [seat_id]
    );
    const seat = seats[0];
    if (!seat) {
      await connection.rollback();
      return sendError(res, `Seat ID ${seat_id} not found.`, 404);
    }
    if (seat.status !== 'active') {
      await connection.rollback();
      return sendError(res, `Seat ${seat.seat_number} is not active and cannot be assigned.`, 409);
    }

    const start = new Date(`${start_date}T00:00:00Z`);
    if (Number.isNaN(start.getTime())) {
      await connection.rollback();
      return sendError(res, 'Start date is invalid.', 422);
    }
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + (plan.duration_days || 30));
    const end_date = end.toISOString().split('T')[0];
    if (end_date <= start_date) {
      await connection.rollback();
      return sendError(res, 'Membership end date must be after its start date.', 422);
    }

    const overlap = await Membership.findActiveOverlap(connection, {
      student_id, seat_id, start_date, end_date
    });
    if (overlap) {
      await connection.rollback();
      return sendError(res, 'The student or selected seat already has an overlapping active membership.', 409);
    }

    const id = await Membership.createWithConnection(connection, {
      student_id, plan_id, seat_id, start_date, end_date
    });
    await connection.commit();
    const membership = await Membership.findById(id);
    return sendSuccess(res, membership, 'Membership created successfully.', 201);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
