/**
 * StudyHub — Membership Plan Controller
 * GET /api/plans — returns all active plans for the pricing page.
 */
'use strict';

const MembershipPlan               = require('../models/MembershipPlan');
const { sendSuccess, sendNotFound } = require('../utils/responseHelper');

/**
 * GET /api/plans
 * Returns all active membership plans with slot details and features.
 * The pricing page reads from this endpoint instead of hardcoded HTML.
 */
async function getAllPlans(req, res) {
  const plans = await MembershipPlan.findAll();
  return sendSuccess(res, plans, 'Membership plans retrieved.', 200, { count: plans.length });
}

/**
 * GET /api/plans/:id
 */
async function getPlanById(req, res) {
  const plan = await MembershipPlan.findById(req.params.id);
  if (!plan) return sendNotFound(res, 'Membership plan');
  return sendSuccess(res, plan);
}

module.exports = { getAllPlans, getPlanById };
