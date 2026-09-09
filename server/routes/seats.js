/**
 * StudyHub — Seat Routes
 * Base path: /api/seats
 * 
 * IMPORTANT: /availability must be declared BEFORE /:id
 * to prevent Express matching "availability" as an :id param.
 */
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/seatController');
const wrap   = require('../middleware/asyncWrapper');
const { requireAdmin } = require('../middleware/auth');
const adminOps = require('../controllers/adminOperationsController');

router.get  ('/availability',    wrap(ctrl.getSeatAvailability));
router.use(requireAdmin);
router.post('/', wrap(adminOps.createSeat));
router.patch('/:id', wrap(adminOps.updateSeat));
router.get  ('/',                wrap(ctrl.getAllSeats));
router.get  ('/:id',             wrap(ctrl.getAllSeats));           // same handler, seat detail
router.patch('/:id/status',      wrap(ctrl.updateSeatStatus));

module.exports = router;
