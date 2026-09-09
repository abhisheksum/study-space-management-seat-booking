/**
 * StudyHub — Membership Plan Routes
 * Base path: /api/plans
 */
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/planController');
const wrap   = require('../middleware/asyncWrapper');
const { requireAdmin } = require('../middleware/auth');
const adminOps = require('../controllers/adminOperationsController');

router.get('/',     wrap(async (req, res) => ctrl.getAllPlans(req, res)));
router.post('/', requireAdmin, wrap(adminOps.createPlan));
router.patch('/:id', requireAdmin, wrap(adminOps.updatePlan));
router.get('/:id',  wrap(ctrl.getPlanById));

module.exports = router;
