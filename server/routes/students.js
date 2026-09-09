/**
 * StudyHub — Student Routes
 * Base path: /api/students
 */
'use strict';

const router     = require('express').Router();
const ctrl       = require('../controllers/studentController');
const wrap       = require('../middleware/asyncWrapper');
const { requireAdmin } = require('../middleware/auth');
const adminOps = require('../controllers/adminOperationsController');
const { uploadStudentPhoto } = require('../middleware/uploadStudentPhoto');

router.post  ('/',           uploadStudentPhoto, wrap(ctrl.createStudent));
router.use(requireAdmin);
router.patch('/:id', wrap(adminOps.updateStudent));
router.get   ('/',           wrap(ctrl.getAllStudents));
router.get   ('/:id',        wrap(ctrl.getStudentById));
router.patch ('/:id',        wrap(ctrl.updateStudent));
router.delete('/:id',        wrap(ctrl.deactivateStudent));

module.exports = router;
