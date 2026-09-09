/**
 * StudyHub — Membership Routes
 * Base path: /api/memberships
 */
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/membershipController');
const wrap   = require('../middleware/asyncWrapper');
const { requireAdmin, requireAdminOrStudent } = require('../middleware/auth');
const adminOps = require('../controllers/adminOperationsController');

router.post  ('/',                 requireAdminOrStudent, wrap(ctrl.createMembership));
router.patch ('/:id/status',       requireAdminOrStudent, wrap(ctrl.updateMembershipStatus));
router.use(requireAdmin);
router.patch('/:id/admin-status', wrap(adminOps.updateMembership));
router.get   ('/',                 wrap(ctrl.getAllMemberships));
router.get   ('/:id',              wrap(ctrl.getMembershipById));

module.exports = router;
