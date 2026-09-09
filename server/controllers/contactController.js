'use strict';

const rateLimit = require('express-rate-limit');
const ContactInquiry = require('../models/ContactInquiry');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many contact submissions. Please try again later.', errors: [] }
});

function validateContact(body) {
  const errors = [];
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.replace(/[\s\-+]/g, '').slice(-10) : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';

  if (name.length < 2 || name.length > 120) errors.push('Name must be between 2 and 120 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) errors.push('Please provide a valid email address.');
  if (!/^[6-9]\d{9}$/.test(mobile)) errors.push('Mobile number must be a valid 10-digit Indian number.');
  if (!subject || subject.length > 80) errors.push('Please choose a valid subject.');
  if (message.length < 10 || message.length > 5000) errors.push('Message must be between 10 and 5000 characters.');

  return { errors, data: { name, email, mobile, subject, message } };
}

async function createInquiry(req, res) {
  const { errors, data } = validateContact(req.body || {});
  if (errors.length) return sendError(res, 'Validation failed.', 422, errors);

  const id = await ContactInquiry.create(data);
  const inquiry = await ContactInquiry.findById(id);
  return sendSuccess(res, inquiry, 'Your message has been received.', 201);
}

module.exports = { createInquiry, contactRateLimiter, validateContact };
