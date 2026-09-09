'use strict';

jest.mock('../models/Payment', () => ({
  findById: jest.fn(),
  createGatewayPending: jest.fn(),
  completeGatewayPayment: jest.fn(),
  failGatewayPayment: jest.fn(),
  findByGatewayOrderId: jest.fn()
}));

jest.mock('../config/database', () => ({
  pool: { execute: jest.fn() }
}));

jest.mock('../models/Membership', () => ({
  updateStatus: jest.fn().mockResolvedValue(true)
}));

jest.mock('../utils/razorpay', () => ({
  config: jest.fn(() => ({ keyId: 'rzp_test_key' })),
  createOrder: jest.fn(),
  verifySignature: jest.fn(),
  verifyWebhook: jest.fn()
}));

const Payment = require('../models/Payment');
const razorpay = require('../utils/razorpay');
const controller = require('../controllers/gatewayPaymentController');
const { pool } = require('../config/database');

function response() {
  return {
    statusCode: 200, body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    get() { return 'signature'; }
  };
}

beforeEach(() => jest.clearAllMocks());

test('creates a Razorpay order using the database plan amount', async () => {
  pool.execute
    .mockResolvedValueOnce([[{ id: 3, student_id: 9, status: 'active', price: 599 }]])
    .mockResolvedValueOnce([[]]);
  razorpay.createOrder.mockResolvedValue({ id: 'order_1', amount: 59900, currency: 'INR' });
  Payment.createGatewayPending.mockResolvedValue(11);
  const res = response();
  await controller.createOrder({ body: { student_id: 9, membership_id: 3, amount: 1 } }, res);
  expect(razorpay.createOrder).toHaveBeenCalledWith(599, expect.any(String));
  expect(res.statusCode).toBe(201);
  expect(res.body.data.payment_id).toBe(11);
});

test('valid signature completes a pending payment', async () => {
  Payment.findById.mockResolvedValue({ id: 11, gateway_order_id: 'order_1', status: 'pending' });
  razorpay.verifySignature.mockReturnValue(true);
  Payment.completeGatewayPayment.mockResolvedValue(true);
  Payment.findById.mockResolvedValueOnce({ id: 11, gateway_order_id: 'order_1', status: 'pending' })
    .mockResolvedValueOnce({ id: 11, status: 'completed', transaction_id: 'pay_1' });
  const res = response();
  await controller.verifyPayment({ body: { payment_id: 11, razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'valid' } }, res);
  expect(Payment.completeGatewayPayment).toHaveBeenCalled();
  expect(res.body.data.status).toBe('completed');
});

test('invalid signature fails the payment', async () => {
  Payment.findById.mockResolvedValue({ id: 11, gateway_order_id: 'order_1', status: 'pending' });
  razorpay.verifySignature.mockReturnValue(false);
  const res = response();
  await controller.verifyPayment({ body: { payment_id: 11, razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'bad' } }, res);
  expect(Payment.failGatewayPayment).toHaveBeenCalledWith(11, 'Invalid Razorpay signature.');
  expect(res.statusCode).toBe(400);
});

test('webhook marks captured payments complete and ignores duplicate completion', async () => {
  razorpay.verifyWebhook.mockReturnValue(true);
  Payment.findByGatewayOrderId.mockResolvedValue({ id: 11, status: 'pending' });
  const req = {
    body: { event: 'payment.captured', payload: { payment: { entity: { order_id: 'order_1', id: 'pay_1' } } } },
    rawBody: Buffer.from('{}'),
    get: () => 'signature'
  };
  const res = response();
  await controller.webhook(req, res);
  expect(Payment.completeGatewayPayment).toHaveBeenCalledWith(11, 'pay_1', 'signature');
  expect(res.statusCode).toBe(200);
});
