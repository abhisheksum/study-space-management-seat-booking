'use strict';

const router = require('express').Router();
const wrap = require('../middleware/asyncWrapper');
const { requireAdmin } = require('../middleware/auth');
const ctrl = require('../controllers/settingsController');

router.use(requireAdmin);
router.get('/', wrap(ctrl.getSettings));
router.patch('/', wrap(ctrl.saveSettings));

module.exports = router;
