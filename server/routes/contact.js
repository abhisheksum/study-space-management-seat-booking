'use strict';

const router = require('express').Router();
const wrap = require('../middleware/asyncWrapper');
const { createInquiry, contactRateLimiter } = require('../controllers/contactController');

router.post('/', contactRateLimiter, wrap(createInquiry));

module.exports = router;
