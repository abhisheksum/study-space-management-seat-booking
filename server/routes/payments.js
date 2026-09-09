/**
 * StudyHub — Payment Routes
 * Base path: /api/payments
 */
'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/paymentController');
const wrap   = require('../middleware/asyncWrapper');
const { requireAdmin } = require('../middleware/auth');
const adminOps = require('../controllers/adminOperationsController');
const gatewayCtrl = require('../controllers/gatewayPaymentController');

router.post('/orders', wrap(gatewayCtrl.createOrder));
router.post('/verify', wrap(gatewayCtrl.verifyPayment));
router.post('/webhook', wrap(gatewayCtrl.webhook));
router.use(requireAdmin);
router.patch('/:id/status', wrap(adminOps.updatePayment));

// Specific named sub-path before /:id
router.get   ('/stats/today',      wrap(ctrl.todayRevenue));

router.post  ('/',                 wrap(ctrl.recordPayment));
router.get   ('/',                 wrap(ctrl.getAllPayments));
router.get   ('/:id',              wrap(ctrl.getPaymentById));
router.patch ('/:id/status',       wrap(ctrl.updatePaymentStatus));

module.exports = router;
