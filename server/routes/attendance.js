/**
 * StudyHub — Attendance Routes
 * Base path: /api/attendance
 */
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/attendanceController');
const wrap   = require('../middleware/asyncWrapper');

router.post  ('/',                 wrap(ctrl.checkIn));
router.get   ('/',                 wrap(ctrl.getAttendance));
router.get   ('/:id',              wrap(ctrl.getAttendanceById));
router.patch ('/:id/checkout',     wrap(ctrl.checkOut));

module.exports = router;
