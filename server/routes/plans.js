/**
 * StudyHub — Membership Plan Routes
 * Base path: /api/plans
 */
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/planController');
const wrap   = require('../middleware/asyncWrapper');

router.get('/',     wrap(ctrl.getAllPlans));
router.get('/:id',  wrap(ctrl.getPlanById));

module.exports = router;
