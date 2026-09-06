/**
 * StudyHub — Membership Routes
 * Base path: /api/memberships
 */
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/membershipController');
const wrap   = require('../middleware/asyncWrapper');

router.post  ('/',                 wrap(ctrl.createMembership));
router.get   ('/',                 wrap(ctrl.getAllMemberships));
router.get   ('/:id',              wrap(ctrl.getMembershipById));
router.patch ('/:id/status',       wrap(ctrl.updateMembershipStatus));

module.exports = router;
