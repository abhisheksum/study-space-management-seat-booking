'use strict';

const crypto = require('crypto');

function config() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET } = process.env;
  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new Error('Razorpay credentials are not configured.');
  return { keyId: RAZORPAY_KEY_ID, secret: RAZORPAY_KEY_SECRET, webhookSecret: RAZORPAY_WEBHOOK_SECRET };
}

async function createOrder(amount, receipt) {
  const { keyId, secret } = config();
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ amount: Math.round(Number(amount) * 100), currency: 'INR', receipt, payment_capture: 1 })
  });
  if (!response.ok) throw new Error(`Razorpay order creation failed with status ${response.status}.`);
  return response.json();
}

function verifySignature(orderId, paymentId, signature) {
  const { secret } = config();
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const actual = Buffer.from(String(signature || ''));
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), actual);
}

function verifyWebhook(rawBody, signature) {
  const { webhookSecret } = config();
  if (!webhookSecret) throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured.');
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const actual = Buffer.from(String(signature || ''));
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), actual);
}

module.exports = { config, createOrder, verifySignature, verifyWebhook };
