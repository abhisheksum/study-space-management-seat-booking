'use strict';

const Payment = require('../models/Payment');
const Membership = require('../models/Membership');
const { pool } = require('../config/database');
const razorpay = require('../utils/razorpay');
const { sendSuccess, sendError } = require('../utils/responseHelper');

async function createOrder(req, res) {
  const { student_id, membership_id } = req.body;
  if (!Number.isInteger(Number(student_id)) || !Number.isInteger(Number(membership_id))) {
    return sendError(res, 'student_id and membership_id are required.', 422);
  }
  const [rows] = await pool.execute(`
    SELECT m.id, m.student_id, m.status, p.price
    FROM memberships m JOIN membership_plans p ON p.id = m.plan_id
    WHERE m.id = ? AND m.student_id = ? AND p.is_active = 1
    LIMIT 1
  `, [membership_id, student_id]);
  const membership = rows[0];
  if (!membership) return sendError(res, 'Active membership and plan could not be found.', 404);
  if (membership.status !== 'active') return sendError(res, 'Only an active membership can be paid.', 409);
  const existing = await pool.execute(
    "SELECT id FROM payments WHERE membership_id = ? AND status = 'completed' LIMIT 1",
    [membership_id]
  );
  if (existing[0][0]) return sendError(res, 'This membership has already been paid.', 409);

  const order = await razorpay.createOrder(membership.price, `membership-${membership_id}-${Date.now()}`);
  const paymentId = await Payment.createGatewayPending({
    student_id, membership_id, amount: membership.price, gateway_order_id: order.id
  });
  return sendSuccess(res, {
    payment_id: paymentId, order_id: order.id, amount: order.amount, currency: order.currency,
    key_id: razorpay.config().keyId
  }, 'Payment order created.', 201);
}

async function verifyPayment(req, res) {
  const { payment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const payment = await Payment.findById(payment_id);
  if (!payment || payment.gateway_order_id !== razorpay_order_id) return sendError(res, 'Payment order not found.', 404);
  if (payment.status === 'completed') return sendSuccess(res, payment, 'Payment already verified.');
  if (!razorpay.verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    await Payment.failGatewayPayment(payment.id, 'Invalid Razorpay signature.');
    return sendError(res, 'Payment signature verification failed.', 400);
  }
  await Payment.completeGatewayPayment(payment.id, razorpay_payment_id, razorpay_signature);
  await Membership.updateStatus(payment.membership_id, 'active');
  return sendSuccess(res, await Payment.findById(payment.id), 'Payment verified successfully.');
}

async function webhook(req, res) {
  const signature = req.get('x-razorpay-signature');
  const rawBody = req.rawBody || JSON.stringify(req.body);
  if (!razorpay.verifyWebhook(rawBody, signature)) return sendError(res, 'Invalid webhook signature.', 400);
  const event = req.body;
  const paymentEntity = event.payload?.payment?.entity;
  const orderId = paymentEntity?.order_id || event.payload?.order?.entity?.id;
  if (orderId) {
    const payment = await Payment.findByGatewayOrderId(orderId);
    if (payment && event.event === 'payment.captured') {
      await Payment.completeGatewayPayment(payment.id, paymentEntity.id, signature);
      await Membership.updateStatus(payment.membership_id, 'active');
    } else if (payment && event.event === 'payment.failed') {
      await Payment.failGatewayPayment(payment.id, paymentEntity.error_description);
    } else if (payment && event.event === 'order.cancelled') {
      await Payment.failGatewayPayment(payment.id, 'Razorpay order was cancelled.');
    }
  }
  return res.status(200).json({ success: true });
}

module.exports = { createOrder, verifyPayment, webhook };
