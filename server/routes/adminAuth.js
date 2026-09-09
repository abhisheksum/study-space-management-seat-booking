'use strict';

const router = require('express').Router();
const wrap = require('../middleware/asyncWrapper');
const ctrl = require('../controllers/adminAuthController');

router.post('/login', ctrl.loginRateLimiter, wrap(ctrl.login));

module.exports = router;
