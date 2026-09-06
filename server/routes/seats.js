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

router.get  ('/availability',    wrap(ctrl.getSeatAvailability));
router.get  ('/',                wrap(ctrl.getAllSeats));
router.get  ('/:id',             wrap(ctrl.getAllSeats));           // same handler, seat detail
router.patch('/:id/status',      wrap(ctrl.updateSeatStatus));

module.exports = router;
