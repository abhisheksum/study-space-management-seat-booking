/**
 * StudyHub — Booking Routes
 * Base path: /api/bookings
 */
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/bookingController');
const wrap   = require('../middleware/asyncWrapper');
const { requireAdmin, requireAdminOrStudent } = require('../middleware/auth');
const adminOps = require('../controllers/adminOperationsController');

router.post  ('/',                 requireAdminOrStudent, wrap(ctrl.createBooking));
router.use(requireAdmin);
router.patch('/:id/status', wrap(adminOps.updateBooking));
router.get   ('/',                 wrap(ctrl.getAllBookings));
router.get   ('/:id',              wrap(ctrl.getBookingById));
router.patch ('/:id/cancel',       wrap(ctrl.cancelBooking));
router.patch ('/:id/complete',     wrap(ctrl.completeBooking));

module.exports = router;
